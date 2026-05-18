package com.trafico.simulator.simulation;

import com.trafico.simulator.domain.enums.ExecutionMode;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.routing.AStarRouteCalculator;
import com.trafico.simulator.simulation.sync.DeadlockDetector;
import com.trafico.simulator.simulation.sync.IntersectionLock;
import com.trafico.simulator.simulation.thread.TrafficLightThread;
import com.trafico.simulator.simulation.thread.VehicleThread;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Encapsula el ciclo de vida completo de una simulación individual (SEQUENTIAL o PARALLEL).
 * No es un Spring bean: {@link Simulator} crea dos instancias independientes por arranque.
 *
 * Cada runner tiene sus propios {@link SimulationState}, {@link IntersectionLock} y
 * {@link DeadlockDetector}, garantizando que las dos simulaciones paralelas no comparten
 * estado mutable y pueden avanzar sin interferencia.
 *
 * Los eventos internos (VehicleThread, TrafficLightThread, DeadlockDetector) se publican
 * en un {@link EventBus} privado. {@link #forwardEvent} los reenvía al bus compartido de Spring
 * añadiendo {@code "mode"} al payload, para que el frontend pueda distinguir a qué runner
 * pertenece cada evento sin modificar los hilos internos.
 */
@Slf4j
public class SimulationRunner {

    private static final long TIMER_INTERVAL_MS = 10L;
    private static final long DEADLOCK_CHECK_MS = 2_000L;

    @Getter private final ExecutionMode    mode;
    @Getter private final SimulationState  state;

    private final AStarRouteCalculator aStarCalc;
    private final EventBus             sharedEventBus;
    private final EventBus             privateEventBus;
    private final IntersectionLock     lock;
    private final DeadlockDetector     deadlockDetector;

    private ExecutorService          vehicleExecutor;
    private ScheduledExecutorService timerExecutor;
    private ScheduledExecutorService deadlockExecutor;
    private final List<TrafficLightThread> lightThreads   = Collections.synchronizedList(new ArrayList<>());
    private final List<VehicleThread>      vehicleThreads = Collections.synchronizedList(new ArrayList<>());

    /**
     * Crea un runner para el modo de ejecución indicado.
     *
     * @param mode           SEQUENTIAL (semáforo=1) o PARALLEL (semáforo=N)
     * @param aStarCalc      calculador A* (stateless, compartido entre runners)
     * @param sharedEventBus bus de eventos Spring compartido por los dos runners
     */
    public SimulationRunner(ExecutionMode mode,
                            AStarRouteCalculator aStarCalc,
                            EventBus sharedEventBus) {
        this.mode           = mode;
        this.aStarCalc      = aStarCalc;
        this.sharedEventBus = sharedEventBus;
        this.state          = new SimulationState();
        this.lock           = new IntersectionLock();
        this.privateEventBus  = new EventBus();
        this.deadlockDetector = new DeadlockDetector(lock, privateEventBus, state);
        this.privateEventBus.subscribe(this::forwardEvent);
    }

    /**
     * Inicia la simulación con la ciudad y los vehículos provistos por {@link Simulator}.
     * Ciudad y vehículos son exclusivos de este runner.
     *
     * @param simId    ID base de la simulación (se añade "-SEQ" o "-PAR")
     * @param params   parámetros base (executionMode se sobreescribe con el modo del runner)
     * @param city     ciudad construida con la misma topología que el otro runner
     * @param vehicles vehículos con orígenes/destinos equivalentes a los del otro runner
     */
    public void start(String simId, SimulationParams params, City city, List<Vehicle> vehicles) {
        stopInternals();
        state.reset();
        lightThreads.clear();
        vehicleThreads.clear();

        SimulationParams modeParams = SimulationParams.builder()
                .gridSize(params.getGridSize())
                .vehicleCount(params.getVehicleCount())
                .executionMode(mode)
                .greenDurationMs(params.getGreenDurationMs())
                .yellowDurationMs(params.getYellowDurationMs())
                .redDurationMs(params.getRedDurationMs())
                .simulationSpeed(params.getSimulationSpeed())
                .smartTrafficLights(params.isSmartTrafficLights())
                .manualPairs(params.getManualPairs())
                .build();

        state.setSimulationId(simId + "-" + mode.name());
        state.setParams(modeParams);
        state.setCity(city);
        for (Vehicle v : vehicles) {
            state.getVehicles().put(v.getId(), v);
        }

        state.setRunning(true);
        startTimer();
        startTrafficLights(city, modeParams);
        startDeadlockDetector();
        startVehicleThreads(vehicles, city, modeParams);

        privateEventBus.publish(SimulationEvent.builder()
                .type(SimulationEventType.ROUTE_CALCULATION_STARTED)
                .timestamp(0L)
                .payload(Map.of("mode", mode.name()))
                .build());

        log.info("SimulationRunner[{}] iniciado — id={}, vehículos={}, semáforos={}",
                mode, state.getSimulationId(), vehicles.size(), city.getAllTrafficLights().size());
    }

    public void pause() {
        if (state.isRunning()) state.setPaused(true);
    }

    public void resume() {
        if (state.isRunning()) state.setPaused(false);
    }

    public void stop() {
        state.setRunning(false);
        state.setPaused(false);
        stopInternals();
    }

    public void setSpeed(double speed) {
        vehicleThreads.forEach(vt -> vt.setSimulationSpeed(speed));
    }

    // ──────────────────────────────────────────────────────────────
    // Privados
    // ──────────────────────────────────────────────────────────────

    /**
     * Reenvía un evento del bus privado al bus compartido, inyectando {@code "mode"} en el payload.
     * Así el frontend puede filtrar eventos por runner sin modificar VehicleThread/TrafficLightThread.
     */
    private void forwardEvent(SimulationEvent event) {
        Map<String, Object> enriched = new HashMap<>(event.getPayload());
        enriched.put("mode", mode.name());
        sharedEventBus.publish(SimulationEvent.builder()
                .type(event.getType())
                .timestamp(event.getTimestamp())
                .payload(enriched)
                .build());
    }

    private void startTimer() {
        String prefix = mode.name().toLowerCase();
        timerExecutor = Executors.newSingleThreadScheduledExecutor(
                r -> new Thread(r, prefix + "-timer"));
        // El timer NO avanza durante la pausa, para que simulationTimeMs refleje
        // solo el tiempo real de simulación (sin incluir el tiempo pausado).
        timerExecutor.scheduleAtFixedRate(() -> {
            if (!state.isPaused()) {
                state.getSimulationTimeMs().addAndGet(TIMER_INTERVAL_MS);
                state.getTick().incrementAndGet();
            }
        }, 0, TIMER_INTERVAL_MS, TimeUnit.MILLISECONDS);
    }

    private void startTrafficLights(City city, SimulationParams params) {
        String prefix = mode.name().toLowerCase();
        for (TrafficLight light : city.getAllTrafficLights()) {
            ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(
                    r -> new Thread(r, prefix + "-light-" + light.getIntersectionId()));
            // Se pasa el estado de simulación para que el semáforo respete la pausa.
            TrafficLightThread thread = new TrafficLightThread(light, params, privateEventBus, scheduler, state);
            thread.start();
            lightThreads.add(thread);
        }
    }

    private void startDeadlockDetector() {
        String prefix = mode.name().toLowerCase();
        deadlockExecutor = Executors.newSingleThreadScheduledExecutor(
                r -> new Thread(r, prefix + "-deadlock"));
        deadlockExecutor.scheduleAtFixedRate(
                deadlockDetector::checkAndResolve,
                DEADLOCK_CHECK_MS, DEADLOCK_CHECK_MS, TimeUnit.MILLISECONDS);
    }

    private void startVehicleThreads(List<Vehicle> vehicles, City city, SimulationParams params) {
        int permits = params.getExecutionMode() == ExecutionMode.SEQUENTIAL ? 1 : vehicles.size();
        Semaphore calcSemaphore = new Semaphore(permits);

        String prefix = mode.name().toLowerCase();
        // Virtual Threads (Java 21+): cada VehicleThread vive en un virtual thread.
        // Razón: con grids extremos podemos tener hasta 2000 vehículos. Un platform
        // thread por vehículo consumiría ~1MB de stack cada uno (~2GB para 2000) y
        // saturaría el planificador del SO. Los virtual threads cuestan ~kilobyte
        // de heap y se multiplexan sobre un pequeño grupo de carrier threads, así
        // que escalan a miles sin penalización. La semántica de Thread.sleep,
        // synchronized y ReentrantLock se mantiene idéntica.
        vehicleExecutor = Executors.newThreadPerTaskExecutor(
                Thread.ofVirtual().name(prefix + "-vehicle-", 0).factory());

        for (Vehicle vehicle : vehicles) {
            VehicleThread vt = new VehicleThread(
                    vehicle, city, lock, privateEventBus, state, aStarCalc, calcSemaphore);
            vehicleThreads.add(vt);
            vehicleExecutor.submit(vt);
        }
    }

    private void stopInternals() {
        if (vehicleExecutor  != null && !vehicleExecutor.isShutdown())  vehicleExecutor.shutdownNow();
        if (timerExecutor    != null && !timerExecutor.isShutdown())    timerExecutor.shutdownNow();
        if (deadlockExecutor != null && !deadlockExecutor.isShutdown()) deadlockExecutor.shutdownNow();
        lightThreads.forEach(TrafficLightThread::stop);
    }
}
