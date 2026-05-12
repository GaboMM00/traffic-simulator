package com.trafico.simulator.metrics;

import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import com.trafico.simulator.simulation.SimulationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para MetricsCollector: agrega correctamente las métricas del SimulationState.
 */
class MetricsCollectorTest {

    private SimulationState state;
    private MetricsCollector collector;

    @BeforeEach
    void setUp() {
        state     = new SimulationState();
        collector = new MetricsCollector(state);
    }

    @Test
    @DisplayName("collect retorna 0 contadores cuando no hay vehículos")
    void collectEmptyState() {
        SimulationMetrics m = collector.collect();
        assertEquals(0, m.getActiveVehicles());
        assertEquals(0, m.getCompletedVehicles());
        assertEquals(0, m.getWaitingVehicles());
        assertEquals(0.0, m.getAverageTravelTimeMs());
        assertNull(m.getLeadVehicleId());
        assertNull(m.getVehicleMetrics(), "collect() no debe incluir detalle por vehículo");
    }

    @Test
    @DisplayName("collect cuenta MOVING y CALCULATING como activos")
    void collectCountsActiveVehicles() {
        addVehicle("V-001", VehicleState.MOVING,     0);
        addVehicle("V-002", VehicleState.CALCULATING, 0);
        addVehicle("V-003", VehicleState.WAITING,     0);

        SimulationMetrics m = collector.collect();
        assertEquals(2, m.getActiveVehicles());
        assertEquals(1, m.getWaitingVehicles());
        assertEquals(0, m.getCompletedVehicles());
    }

    @Test
    @DisplayName("collect calcula promedio de travelTimeMs solo de COMPLETED")
    void collectAverageTravelTime() {
        Vehicle v1 = addVehicle("V-001", VehicleState.COMPLETED, 0);
        v1.setTravelTimeMs(1000L);
        v1.setArrivalOrder(1);

        Vehicle v2 = addVehicle("V-002", VehicleState.COMPLETED, 0);
        v2.setTravelTimeMs(3000L);
        v2.setArrivalOrder(2);

        addVehicle("V-003", VehicleState.MOVING, 0); // no cuenta para avg

        SimulationMetrics m = collector.collect();
        assertEquals(2, m.getCompletedVehicles());
        assertEquals(2000.0, m.getAverageTravelTimeMs(), 0.001);
    }

    @Test
    @DisplayName("collect identifica al vehículo líder (menor travelTimeMs)")
    void collectLeadVehicle() {
        Vehicle v1 = addVehicle("V-001", VehicleState.COMPLETED, 0);
        v1.setTravelTimeMs(5000L);
        v1.setArrivalOrder(2);

        Vehicle v2 = addVehicle("V-002", VehicleState.COMPLETED, 0);
        v2.setTravelTimeMs(2000L);
        v2.setArrivalOrder(1);

        SimulationMetrics m = collector.collect();
        assertEquals("V-002", m.getLeadVehicleId());
        assertEquals(2000L, m.getLeadVehicleTravelTimeMs());
    }

    @Test
    @DisplayName("collect incluye tiempos seq/par del estado")
    void collectIncludesRouteTimings() {
        state.setSequentialRouteTimeMs(500L);
        state.setParallelRouteTimeMs(200L);

        SimulationMetrics m = collector.collect();
        assertEquals(500L, m.getSequentialRouteTimeMs());
        assertEquals(200L, m.getParallelRouteTimeMs());
    }

    @Test
    @DisplayName("collect calcula speedup = seq/par cuando par > 0")
    void collectSpeedup() {
        state.setSequentialRouteTimeMs(600L);
        state.setParallelRouteTimeMs(200L);

        SimulationMetrics m = collector.collect();
        assertNotNull(m.getSpeedup());
        assertEquals(3.0, m.getSpeedup(), 0.001);
    }

    @Test
    @DisplayName("collect retorna speedup null cuando par == 0")
    void collectSpeedupNullWhenParIsZero() {
        state.setSequentialRouteTimeMs(600L);
        state.setParallelRouteTimeMs(0L);

        SimulationMetrics m = collector.collect();
        assertNull(m.getSpeedup());
    }

    @Test
    @DisplayName("collectFinal incluye lista de vehicleMetrics")
    void collectFinalIncludesVehicleMetrics() {
        Vehicle v1 = addVehicle("V-001", VehicleState.COMPLETED, 0);
        v1.setTravelTimeMs(1000L);
        v1.setArrivalOrder(1);
        v1.setRoute(Route.of(
                new Coordinate(0, 0), new Coordinate(2, 0),
                List.of(new Coordinate(0, 0), new Coordinate(1, 0), new Coordinate(2, 0))));

        SimulationMetrics m = collector.collectFinal();
        assertNotNull(m.getVehicleMetrics());
        assertEquals(1, m.getVehicleMetrics().size());
        assertEquals("V-001", m.getVehicleMetrics().get(0).getVehicleId());
    }

    @Test
    @DisplayName("collectFinal excluye vehículos NO_ROUTE de vehicleMetrics")
    void collectFinalExcludesNoRoute() {
        addVehicle("V-001", VehicleState.NO_ROUTE,  0);

        Vehicle v2 = addVehicle("V-002", VehicleState.COMPLETED, 0);
        v2.setTravelTimeMs(800L);
        v2.setArrivalOrder(1);

        SimulationMetrics m = collector.collectFinal();
        assertNotNull(m.getVehicleMetrics());
        assertEquals(1, m.getVehicleMetrics().size());
        assertEquals("V-002", m.getVehicleMetrics().get(0).getVehicleId());
    }

    @Test
    @DisplayName("collect incluye congestionId desde la ciudad")
    void collectCongestedIntersection() {
        City city = City.build(4);
        state.setCity(city);
        city.getIntersection(new Coordinate(1, 1)).recordVehicleWait();
        city.getIntersection(new Coordinate(1, 1)).recordVehicleWait();
        city.getIntersection(new Coordinate(2, 2)).recordVehicleWait();

        SimulationMetrics m = collector.collect();
        assertEquals("I-1-1", m.getMostCongestedIntersectionId());
        assertEquals(2, m.getMostCongestedIntersectionWaits());
    }

    // ──────────────────────────────────────────────────────────────

    private Vehicle addVehicle(String id, VehicleState vehicleState, long startMs) {
        Vehicle v = new Vehicle(id, 0, startMs);
        v.setState(vehicleState);
        state.getVehicles().put(id, v);
        return v;
    }
}
