package com.trafico.simulator.simulation.thread;

import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.routing.AStarRouteCalculator;
import com.trafico.simulator.simulation.sync.IntersectionLock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para VehicleThread: ciclo de vida, locks, semáforos y estados terminales.
 */
class VehicleThreadTest {

    private City                 city;
    private IntersectionLock     lock;
    private EventBus             eventBus;
    private SimulationState      state;
    private AStarRouteCalculator routeCalc;
    private List<SimulationEvent> events;

    @BeforeEach
    void setUp() {
        city      = City.build(8);
        lock      = new IntersectionLock();
        eventBus  = new EventBus();
        state     = new SimulationState();
        routeCalc = new AStarRouteCalculator();
        events    = new ArrayList<>();
        eventBus.subscribe(events::add);

        state.setParams(SimulationParams.builder()
                .gridSize(8).vehicleCount(1)
                .executionMode(com.trafico.simulator.domain.enums.ExecutionMode.PARALLEL)
                .greenDurationMs(5000).yellowDurationMs(2000).redDurationMs(6000)
                .simulationSpeed(10.0)
                .smartTrafficLights(false).build());
        state.setRunning(true);
    }

    @Test
    @DisplayName("Vehículo sin ruta válida (calculador devuelve vacío) cambia a NO_ROUTE inmediatamente")
    void noRouteVehicle() {
        // La ciudad garantiza conectividad de esquinas, por lo que no hay dead-ends garantizados
        // en la topología del grafo. Usamos un calculador stub que siempre devuelve ruta vacía
        // para testear aisladamente la lógica de VehicleThread ante Route.empty.
        AStarRouteCalculator noRouteCalc = new AStarRouteCalculator() {
            @Override
            public Route calculate(City city, Coordinate origin, Coordinate destination) {
                return Route.empty(origin, destination);
            }
        };

        Vehicle v = newVehicle("V-001", new Coordinate(0, 0));
        v.setDestination(new Coordinate(7, 7));
        state.getVehicles().put(v.getId(), v);

        VehicleThread vt = new VehicleThread(v, city, lock, eventBus, state,
                noRouteCalc, new Semaphore(Integer.MAX_VALUE));
        Thread t = new Thread(vt);
        t.start();

        await().atMost(2, TimeUnit.SECONDS).until(() -> v.getState() == VehicleState.NO_ROUTE);
        assertEquals(1, state.getNoRouteVehicleCount().get());
    }

    @Test
    @DisplayName("Vehículo con ruta válida (sin semáforos bloqueando) llega al destino")
    void vehicleReachesDestination() {
        // Ruta corta a lo largo de row=0 (par → ESTE): col 0 → col 3
        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(3, 0);

        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.GREEN));

        Vehicle v = newVehicle("V-001", origin);
        v.setDestination(dest);
        state.getVehicles().put(v.getId(), v);

        VehicleThread vt = new VehicleThread(v, city, lock, eventBus, state,
                routeCalc, new Semaphore(Integer.MAX_VALUE));
        Thread t = new Thread(vt);
        t.start();

        await().atMost(5, TimeUnit.SECONDS).until(v::isCompleted);
        assertEquals(dest, v.getCurrentPosition());
        assertEquals(1, v.getArrivalOrder());
        assertEquals(1, state.getCompletedVehicles().get());

        boolean arrivedEvent = events.stream()
                .anyMatch(e -> e.getType() == SimulationEventType.VEHICLE_ARRIVED);
        assertTrue(arrivedEvent, "Debe publicar VEHICLE_ARRIVED");
    }

    @Test
    @DisplayName("Cuando todos completan, publica SIMULATION_FINISHED")
    void simulationFinishedWhenAllComplete() {
        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.GREEN));

        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(2, 0);
        Vehicle v = newVehicle("V-001", origin);
        v.setDestination(dest);
        state.getVehicles().put(v.getId(), v);

        Thread t = new Thread(new VehicleThread(v, city, lock, eventBus, state,
                routeCalc, new Semaphore(Integer.MAX_VALUE)));
        t.start();

        await().atMost(5, TimeUnit.SECONDS).until(() ->
                events.stream().anyMatch(e -> e.getType() == SimulationEventType.SIMULATION_FINISHED));
    }

    @Test
    @DisplayName("Vehículo respeta semáforo en RED y luego avanza al ponerse en GREEN")
    void vehicleWaitsForGreenLight() throws InterruptedException {
        Coordinate origin = new Coordinate(0, 0); // intersección con semáforo (step=2)
        Coordinate dest   = new Coordinate(3, 0);

        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.RED));

        Vehicle v = newVehicle("V-001", origin);
        v.setDestination(dest);
        state.getVehicles().put(v.getId(), v);

        Thread t = new Thread(new VehicleThread(v, city, lock, eventBus, state,
                routeCalc, new Semaphore(Integer.MAX_VALUE)));
        t.start();

        await().atMost(2, TimeUnit.SECONDS).until(() -> v.getState() == VehicleState.WAITING);

        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.GREEN));
        await().atMost(5, TimeUnit.SECONDS).until(v::isCompleted);
    }

    @Test
    @DisplayName("Vehículo libera todos los locks al completar (no quedan locks huérfanos)")
    void noOrphanLocksAfterCompletion() {
        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.GREEN));

        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(2, 0);
        Vehicle v = newVehicle("V-001", origin);
        v.setDestination(dest);
        state.getVehicles().put(v.getId(), v);

        Thread t = new Thread(new VehicleThread(v, city, lock, eventBus, state,
                routeCalc, new Semaphore(Integer.MAX_VALUE)));
        t.start();

        await().atMost(5, TimeUnit.SECONDS).until(v::isCompleted);
        assertNull(lock.getHeldBy().get(dest.toIntersectionId()),
                "Tras completar, no debe quedar registro de ocupación");
        assertTrue(lock.tryLock(dest.toIntersectionId()));
        lock.unlock(dest.toIntersectionId());
    }

    @Test
    @DisplayName("Stop externo (running=false) hace que el vehículo termine sin completar")
    void externalStopExitsCleanly() throws InterruptedException {
        city.getAllTrafficLights().forEach(tl -> tl.setState(TrafficLightState.RED));

        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(3, 0);
        Vehicle v = newVehicle("V-001", origin);
        v.setDestination(dest);
        state.getVehicles().put(v.getId(), v);

        Thread t = new Thread(new VehicleThread(v, city, lock, eventBus, state,
                routeCalc, new Semaphore(Integer.MAX_VALUE)));
        t.start();

        await().atMost(2, TimeUnit.SECONDS).until(() -> v.getState() == VehicleState.WAITING);
        state.setRunning(false);
        t.join(3000);
        assertFalse(t.isAlive(), "El hilo debe terminar al detenerse la simulación");
        assertNotEquals(VehicleState.COMPLETED, v.getState());
    }

    private Vehicle newVehicle(String id, Coordinate origin) {
        Vehicle v = new Vehicle(id, 0, 0L);
        v.setCurrentPosition(origin);
        v.setPreviousPosition(origin);
        return v;
    }
}
