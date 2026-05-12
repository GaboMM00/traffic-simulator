package com.trafico.simulator.simulation.sync;

import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.SimulationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para DeadlockDetector: detección de ciclos en el grafo de espera
 * (waits-for graph) y selección correcta de víctima por mayor wait time.
 */
class DeadlockDetectorTest {

    private IntersectionLock lock;
    private EventBus         eventBus;
    private SimulationState  state;
    private DeadlockDetector detector;
    private List<SimulationEvent> publishedEvents;

    @BeforeEach
    void setUp() {
        lock     = new IntersectionLock();
        eventBus = new EventBus();
        state    = new SimulationState();
        detector = new DeadlockDetector(lock, eventBus, state);

        publishedEvents = new ArrayList<>();
        eventBus.subscribe(publishedEvents::add);
    }

    @Test
    @DisplayName("Sin esperas: no detecta deadlock ni publica evento")
    void noWaitingNoEvent() {
        detector.checkAndResolve();
        assertTrue(publishedEvents.isEmpty());
    }

    @Test
    @DisplayName("Espera lineal sin ciclo: no se detecta deadlock")
    void linearWaitNoDeadlock() {
        // V1 espera I-A (held by V2), V2 espera I-B (libre)
        lock.registerHolder("I-A", "V-002");
        lock.registerWait("V-001", "I-A");
        lock.registerWait("V-002", "I-B"); // I-B no tiene holder

        detector.checkAndResolve();
        assertTrue(publishedEvents.isEmpty(),
                "Sin ciclo (cadena lineal terminando en intersección libre) no es deadlock");
    }

    @Test
    @DisplayName("Ciclo de 2 vehículos: detecta deadlock y publica DEADLOCK_DETECTED")
    void simpleCycleTwoVehicles() {
        Vehicle v1 = newVehicle("V-001", 1000);
        Vehicle v2 = newVehicle("V-002", 5000); // mayor wait → víctima
        state.getVehicles().put(v1.getId(), v1);
        state.getVehicles().put(v2.getId(), v2);

        // V1 ocupa I-A y espera I-B; V2 ocupa I-B y espera I-A → ciclo
        lock.registerHolder("I-A", "V-001");
        lock.registerHolder("I-B", "V-002");
        lock.registerWait("V-001", "I-B");
        lock.registerWait("V-002", "I-A");

        detector.checkAndResolve();

        assertEquals(1, publishedEvents.size());
        SimulationEvent ev = publishedEvents.get(0);
        assertEquals(SimulationEventType.DEADLOCK_DETECTED, ev.getType());
        assertEquals("V-002", ev.getPayload().get("victimVehicleId"),
                "La víctima debe ser el vehículo con mayor wait time acumulado");
        assertTrue(lock.isMarkedAsVictim("V-002"));
        assertFalse(lock.isMarkedAsVictim("V-001"));
    }

    @Test
    @DisplayName("Ciclo de 3 vehículos: detecta correctamente y elige víctima")
    void threeWayDeadlock() {
        Vehicle v1 = newVehicle("V-001", 100);
        Vehicle v2 = newVehicle("V-002", 200);
        Vehicle v3 = newVehicle("V-003", 9999);
        state.getVehicles().put(v1.getId(), v1);
        state.getVehicles().put(v2.getId(), v2);
        state.getVehicles().put(v3.getId(), v3);

        lock.registerHolder("I-A", "V-001");
        lock.registerHolder("I-B", "V-002");
        lock.registerHolder("I-C", "V-003");
        lock.registerWait("V-001", "I-B");
        lock.registerWait("V-002", "I-C");
        lock.registerWait("V-003", "I-A");

        detector.checkAndResolve();

        assertEquals(1, publishedEvents.size());
        assertEquals("V-003", publishedEvents.get(0).getPayload().get("victimVehicleId"),
                "V-003 con 9999ms debe ser la víctima");
    }

    @Test
    @DisplayName("Vehículo esperando intersección libre (sin holder) no genera ciclo")
    void waitingForFreeIntersection() {
        Vehicle v1 = newVehicle("V-001", 1000);
        state.getVehicles().put(v1.getId(), v1);
        lock.registerWait("V-001", "I-X"); // I-X sin holder

        detector.checkAndResolve();
        assertTrue(publishedEvents.isEmpty());
    }

    @Test
    @DisplayName("Auto-espera (vehículo esperando su propio lock) se ignora correctamente")
    void selfWaitDoesNotTriggerDeadlock() {
        Vehicle v1 = newVehicle("V-001", 100);
        state.getVehicles().put(v1.getId(), v1);
        lock.registerHolder("I-A", "V-001");
        lock.registerWait("V-001", "I-A"); // se espera a sí mismo (no debe contar)

        detector.checkAndResolve();
        assertTrue(publishedEvents.isEmpty(),
                "Una auto-espera no construye un ciclo válido en el grafo");
    }

    private Vehicle newVehicle(String id, long waitMs) {
        Vehicle v = new Vehicle(id, 0, 0L);
        v.addWaitTime(waitMs);
        return v;
    }
}
