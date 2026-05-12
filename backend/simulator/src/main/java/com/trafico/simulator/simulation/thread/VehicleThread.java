package com.trafico.simulator.simulation.thread;

import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.Street;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.routing.AStarRouteCalculator;
import com.trafico.simulator.simulation.sync.IntersectionLock;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;

/**
 * Hilo concurrente que controla el ciclo de vida completo de un vehículo individual:
 * primero calcula su propia ruta usando A* (CALCULATING) y luego se mueve por el mapa (MOVING).
 *
 * La diferencia entre modo SECUENCIAL y PARALELO reside en el semáforo {@code calcSemaphore}:
 * - SECUENCIAL: Semaphore(1) → solo un vehículo calcula a la vez; aparecen de uno en uno.
 * - PARALELO:   Semaphore(N) → todos calculan simultáneamente; arrancan en ráfaga.
 *
 * Ciclo de vida: CALCULATING → MOVING ↔ WAITING → COMPLETED (o NO_ROUTE).
 *
 * Protocolo de locking durante el movimiento:
 *   - Al avanzar de A → B: tryLock(B), mover, unlock(A).
 *   - La intersección de origen no se lockea (pueden partir varios vehículos del mismo borde).
 *   - El lock siempre se libera en el bloque finally para evitar locks huérfanos.
 */
@Slf4j
public class VehicleThread implements Runnable {

    /** Milisegundos entre pasos de movimiento a velocidad 1x. */
    private static final long BASE_STEP_MS  = 500L;
    /** Intervalo de reintento al esperar un lock de intersección. */
    private static final long LOCK_RETRY_MS = 50L;
    /** Intervalo de polling del semáforo en espera de luz verde. */
    private static final long LIGHT_POLL_MS = 100L;
    /** Intervalo de polling cuando la simulación está en pausa. */
    private static final long PAUSE_POLL_MS = 100L;
    /** Tiempo de espera continuo en semáforo que genera evento VEHICLE_WAITING. */
    private static final long WAIT_EVENT_MS = 5_000L;

    private final Vehicle             vehicle;
    private final City                city;
    private final IntersectionLock    intersectionLock;
    private final EventBus            eventBus;
    private final SimulationState     simulationState;
    private final AStarRouteCalculator routeCalculator;

    /**
     * Semáforo compartido entre todos los vehículos de la simulación.
     * Controla cuántos vehículos pueden calcular su ruta simultáneamente:
     *   - Semaphore(1)   → modo SECUENCIAL
     *   - Semaphore(N)   → modo PARALELO
     */
    private final Semaphore calcSemaphore;

    /** Velocidad de simulación (determina el sleep entre movimientos). */
    private volatile double simulationSpeed;

    /**
     * Crea el hilo de un vehículo con sus dependencias.
     *
     * @param vehicle          vehículo a controlar
     * @param city             ciudad con el grafo de calles
     * @param intersectionLock gestor de locks por intersección
     * @param eventBus         bus de eventos para publicar VEHICLE_ARRIVED, etc.
     * @param simulationState  estado compartido de la simulación
     * @param routeCalculator  calculador A* para obtener la ruta en tiempo real
     * @param calcSemaphore    semáforo que controla el paralelismo del cálculo de rutas
     */
    public VehicleThread(Vehicle vehicle, City city, IntersectionLock intersectionLock,
                         EventBus eventBus, SimulationState simulationState,
                         AStarRouteCalculator routeCalculator, Semaphore calcSemaphore) {
        this.vehicle          = vehicle;
        this.city             = city;
        this.intersectionLock = intersectionLock;
        this.eventBus         = eventBus;
        this.simulationState  = simulationState;
        this.routeCalculator  = routeCalculator;
        this.calcSemaphore    = calcSemaphore;
        this.simulationSpeed  = simulationState.getParams().getSimulationSpeed();
    }

    /**
     * Lógica principal del hilo: primero calcula la ruta (respetando el semáforo de modo)
     * y luego se mueve nodo a nodo respetando semáforos y locks de intersección.
     */
    @Override
    public void run() {
        log.debug("Vehículo {} iniciando (CALCULATING)", vehicle.getId());

        // ── FASE 1: CÁLCULO DE RUTA ───────────────────────────────────────────
        vehicle.setState(VehicleState.CALCULATING);

        Route route;
        try {
            route = calcularRuta();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Vehículo {} interrumpido durante cálculo de ruta", vehicle.getId());
            return;
        }

        vehicle.setRoute(route);
        registrarCalculoCompletado();

        if (route == null || !route.isValid()) {
            vehicle.setState(VehicleState.NO_ROUTE);
            simulationState.getNoRouteVehicleCount().incrementAndGet();
            log.warn("Vehículo {} sin ruta válida hacia {}", vehicle.getId(), vehicle.getDestination());
            checkAllCompleted();
            return;
        }

        // ── FASE 2: MOVIMIENTO ────────────────────────────────────────────────
        List<Coordinate> waypoints = route.getWaypoints();
        vehicle.setState(VehicleState.MOVING);

        String currentLockId = null;

        try {
            for (int i = 1; i < waypoints.size(); i++) {
                if (!simulationState.isRunning()) break;

                awaitUnpause();
                if (!simulationState.isRunning()) break;

                Intersection currentIntersection = city.getIntersection(vehicle.getCurrentPosition());
                Coordinate   nextCoord           = waypoints.get(i);
                String       nextId              = nextCoord.toIntersectionId();

                if (currentIntersection.hasTrafficLight()) {
                    waitForGreenLight(currentIntersection.getTrafficLight());
                }
                if (!simulationState.isRunning()) break;

                boolean acquired = acquireLock(nextId);
                if (!acquired) break;

                Coordinate prevCoord = vehicle.getCurrentPosition();
                vehicle.setPreviousPosition(prevCoord);

                Street street = currentIntersection.getStreetTo(city.getIntersection(nextCoord));
                if (street != null) {
                    vehicle.setDirection(street.getDirection());
                }
                vehicle.setCurrentPosition(nextCoord);
                intersectionLock.registerHolder(nextId, vehicle.getId());

                if (currentLockId != null) {
                    intersectionLock.clearHolder(currentLockId);
                    intersectionLock.unlock(currentLockId);
                }
                currentLockId = nextId;

                sleepForStep();
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Vehículo {} interrumpido durante movimiento", vehicle.getId());
        } finally {
            if (currentLockId != null) {
                intersectionLock.clearHolder(currentLockId);
                intersectionLock.unlock(currentLockId);
            }
        }

        if (simulationState.isRunning() && vehicle.getState() == VehicleState.MOVING) {
            onVehicleCompleted();
        }
    }

    /**
     * Actualiza la velocidad de simulación en tiempo real.
     *
     * @param speed multiplicador de velocidad (0.5 a 3.0)
     */
    public void setSimulationSpeed(double speed) {
        this.simulationSpeed = speed;
    }

    // ──────────────────────────────────────────────────────────────
    // Fase 1: métodos de cálculo de ruta
    // ──────────────────────────────────────────────────────────────

    /**
     * Adquiere el semáforo de cálculo y ejecuta A* para obtener la ruta del vehículo.
     * En modo SECUENCIAL el semáforo tiene un solo permiso: los vehículos calculan de uno en uno.
     * En modo PARALELO el semáforo tiene N permisos: todos calculan simultáneamente.
     *
     * @return ruta calculada, o ruta vacía si la simulación se detuvo durante el cálculo
     * @throws InterruptedException si el hilo es interrumpido mientras espera el semáforo
     */
    private Route calcularRuta() throws InterruptedException {
        calcSemaphore.acquire();
        try {
            if (!simulationState.isRunning()) {
                return Route.empty(vehicle.getCurrentPosition(), vehicle.getDestination());
            }
            return routeCalculator.calculate(city, vehicle.getCurrentPosition(), vehicle.getDestination());
        } finally {
            calcSemaphore.release();
        }
    }

    /**
     * Incrementa el contador de vehículos que terminaron de calcular su ruta.
     * Cuando el último vehículo completa esta fase, publica ROUTE_CALCULATION_FINISHED
     * con los tiempos de benchmark para que el frontend muestre el resultado.
     */
    private void registrarCalculoCompletado() {
        int calculados = simulationState.getRoutesCalculated().incrementAndGet();
        int total      = simulationState.getVehicles().size();

        if (calculados >= total) {
            long seqMs  = simulationState.getSequentialRouteTimeMs();
            long parMs  = simulationState.getParallelRouteTimeMs();
            double speedup = parMs > 0 ? (double) seqMs / parMs : 1.0;

            log.info("Todos los vehículos calcularon su ruta — seq={}ms, par={}ms, speedup={:.2f}",
                    seqMs, parMs, speedup);

            eventBus.publish(SimulationEvent.builder()
                    .type(SimulationEventType.ROUTE_CALCULATION_FINISHED)
                    .timestamp(simulationState.getSimulationTimeMs().get())
                    .payload(Map.of(
                            "sequentialMs", seqMs,
                            "parallelMs",   parMs,
                            "speedup",      speedup
                    ))
                    .build());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Fase 2: métodos de movimiento (sin cambios respecto a diseño original)
    // ──────────────────────────────────────────────────────────────

    /**
     * Espera activa mientras la simulación está en pausa.
     */
    private void awaitUnpause() throws InterruptedException {
        while (simulationState.isPaused() && simulationState.isRunning()) {
            Thread.sleep(PAUSE_POLL_MS);
        }
    }

    /**
     * Espera hasta que el semáforo esté en VERDE antes de salir de la intersección.
     * Acumula tiempo de espera y publica evento si la espera supera el umbral.
     */
    private void waitForGreenLight(TrafficLight light) throws InterruptedException {
        if (light.allowsTraffic()) return;

        vehicle.setState(VehicleState.WAITING);
        light.incrementQueue();
        simulationState.getWaitingVehicles().incrementAndGet();

        if (light.getQueueSize().get() > 5) {
            eventBus.publish(SimulationEvent.builder()
                    .type(SimulationEventType.HIGH_CONGESTION)
                    .timestamp(simulationState.getSimulationTimeMs().get())
                    .payload(Map.of("intersectionId", light.getIntersectionId(),
                                    "queueSize",       light.getQueueSize().get()))
                    .build());
        }

        long waitStart = System.currentTimeMillis();

        while (!light.allowsTraffic() && simulationState.isRunning()) {
            awaitUnpause();
            Thread.sleep(LIGHT_POLL_MS);
        }

        long waitedMs = System.currentTimeMillis() - waitStart;
        vehicle.addWaitTime(waitedMs);
        simulationState.getWaitingVehicles().decrementAndGet();
        light.decrementQueue();
        vehicle.setState(VehicleState.MOVING);

        if (waitedMs > WAIT_EVENT_MS) {
            eventBus.publish(SimulationEvent.builder()
                    .type(SimulationEventType.VEHICLE_WAITING)
                    .timestamp(simulationState.getSimulationTimeMs().get())
                    .payload(Map.of("vehicleId", vehicle.getId(), "waitMs", waitedMs))
                    .build());
        }

        Intersection intersection = city.getIntersectionById(light.getIntersectionId());
        if (intersection != null) {
            intersection.recordVehicleWait();
        }
    }

    /**
     * Intenta adquirir el lock de la siguiente intersección con política de reintento.
     * Si es marcado como víctima de deadlock, abandona y retorna false.
     *
     * @param nextId ID de la intersección a bloquear
     * @return true si se adquirió el lock, false si la simulación se detuvo o fue víctima
     */
    private boolean acquireLock(String nextId) throws InterruptedException {
        intersectionLock.registerWait(vehicle.getId(), nextId);
        vehicle.setState(VehicleState.WAITING);

        long waitStart = System.currentTimeMillis();

        try {
            while (!intersectionLock.tryLock(nextId)) {
                if (!simulationState.isRunning()) return false;

                if (intersectionLock.isMarkedAsVictim(vehicle.getId())) {
                    intersectionLock.clearVictim(vehicle.getId());
                    log.debug("Vehículo {} resuelve deadlock cediendo paso en {}", vehicle.getId(), nextId);
                    vehicle.setState(VehicleState.MOVING);
                    return false;
                }

                long waitedMs = System.currentTimeMillis() - waitStart;
                vehicle.addWaitTime(LOCK_RETRY_MS);
                simulationState.getWaitingVehicles().incrementAndGet();

                awaitUnpause();
                Thread.sleep(LOCK_RETRY_MS);

                simulationState.getWaitingVehicles().decrementAndGet();

                if (waitedMs > WAIT_EVENT_MS && waitedMs % WAIT_EVENT_MS < LOCK_RETRY_MS * 2) {
                    eventBus.publish(SimulationEvent.builder()
                            .type(SimulationEventType.VEHICLE_WAITING)
                            .timestamp(simulationState.getSimulationTimeMs().get())
                            .payload(Map.of("vehicleId", vehicle.getId(),
                                            "waitMs",    waitedMs,
                                            "blocking",  nextId))
                            .build());
                }
            }
        } finally {
            intersectionLock.clearWait(vehicle.getId());
        }

        vehicle.setState(VehicleState.MOVING);
        return true;
    }

    /**
     * Duerme el tiempo correspondiente a un paso de movimiento según la velocidad actual.
     */
    private void sleepForStep() throws InterruptedException {
        long stepMs = (long) (BASE_STEP_MS / simulationSpeed);
        Thread.sleep(stepMs);
    }

    /**
     * Marca el vehículo como COMPLETED, registra el tiempo de viaje y el orden de llegada,
     * y publica VEHICLE_ARRIVED. Si todos terminaron, publica SIMULATION_FINISHED.
     */
    private void onVehicleCompleted() {
        vehicle.setState(VehicleState.COMPLETED);

        long travelTimeMs = simulationState.getSimulationTimeMs().get() - vehicle.getStartTimeMs();
        vehicle.setTravelTimeMs(travelTimeMs);

        int arrivalOrder = simulationState.getCompletedVehicles().incrementAndGet();
        vehicle.setArrivalOrder(arrivalOrder);

        log.info("Vehículo {} llegó (orden #{}, viaje={}ms)", vehicle.getId(), arrivalOrder, travelTimeMs);

        Map<String, Object> payload = new HashMap<>();
        payload.put("vehicleId",    vehicle.getId());
        payload.put("arrivalOrder", arrivalOrder);
        payload.put("travelTimeMs", travelTimeMs);

        eventBus.publish(SimulationEvent.builder()
                .type(SimulationEventType.VEHICLE_ARRIVED)
                .timestamp(simulationState.getSimulationTimeMs().get())
                .payload(payload)
                .build());

        checkAllCompleted();
    }

    /**
     * Verifica si la simulación debe finalizar (todos los vehículos completaron o no tienen ruta).
     */
    private void checkAllCompleted() {
        int total     = simulationState.getVehicles().size();
        int completed = simulationState.getCompletedVehicles().get();
        int noRoute   = simulationState.getNoRouteVehicleCount().get();

        if (completed + noRoute >= total) {
            simulationState.setRunning(false);
            log.info("Simulación {} finalizada: {} completados, {} sin ruta",
                    simulationState.getSimulationId(), completed, noRoute);
            eventBus.publish(SimulationEvent.of(
                    SimulationEventType.SIMULATION_FINISHED,
                    simulationState.getSimulationTimeMs().get()
            ));
        }
    }
}
