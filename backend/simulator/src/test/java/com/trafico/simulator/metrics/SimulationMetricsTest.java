package com.trafico.simulator.metrics;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para SimulationMetrics: construcción con builder y comportamiento de campos opcionales.
 */
class SimulationMetricsTest {

    @Test
    @DisplayName("Builder asigna todos los campos correctamente")
    void builderSetsAllFields() {
        VehicleMetrics vm = VehicleMetrics.builder().vehicleId("V-001").arrivalOrder(1)
                .travelTimeMs(1000L).waitTimeMs(200L).waitTimePercent(20.0)
                .routeLength(5).completed(true).build();

        SimulationMetrics m = SimulationMetrics.builder()
                .activeVehicles(3)
                .completedVehicles(7)
                .waitingVehicles(2)
                .mostCongestedIntersectionId("I-2-2")
                .mostCongestedIntersectionWaits(15)
                .leadVehicleId("V-001")
                .leadVehicleTravelTimeMs(1000L)
                .averageTravelTimeMs(2500.0)
                .sequentialRouteTimeMs(400L)
                .parallelRouteTimeMs(150L)
                .speedup(2.667)
                .vehicleMetrics(List.of(vm))
                .build();

        assertEquals(3,          m.getActiveVehicles());
        assertEquals(7,          m.getCompletedVehicles());
        assertEquals(2,          m.getWaitingVehicles());
        assertEquals("I-2-2",   m.getMostCongestedIntersectionId());
        assertEquals(15,         m.getMostCongestedIntersectionWaits());
        assertEquals("V-001",   m.getLeadVehicleId());
        assertEquals(1000L,      m.getLeadVehicleTravelTimeMs());
        assertEquals(2500.0,     m.getAverageTravelTimeMs(), 0.001);
        assertEquals(400L,       m.getSequentialRouteTimeMs());
        assertEquals(150L,       m.getParallelRouteTimeMs());
        assertNotNull(m.getSpeedup());
        assertEquals(2.667,      m.getSpeedup(), 0.001);
        assertEquals(1,          m.getVehicleMetrics().size());
    }

    @Test
    @DisplayName("speedup es null cuando no se proporciona")
    void speedupNullByDefault() {
        SimulationMetrics m = SimulationMetrics.builder()
                .sequentialRouteTimeMs(100L)
                .parallelRouteTimeMs(0L)
                .build();
        assertNull(m.getSpeedup());
    }

    @Test
    @DisplayName("vehicleMetrics es null en snapshots periódicos (collect sin final)")
    void vehicleMetricsNullInPeriodicSnapshot() {
        SimulationMetrics m = SimulationMetrics.builder()
                .activeVehicles(5)
                .completedVehicles(2)
                .build();
        assertNull(m.getVehicleMetrics());
    }

    @Test
    @DisplayName("No-args constructor produce objeto vacío sin NPE")
    void noArgConstructorSafe() {
        SimulationMetrics m = new SimulationMetrics();
        assertEquals(0,    m.getActiveVehicles());
        assertEquals(0,    m.getCompletedVehicles());
        assertNull(m.getLeadVehicleId());
        assertNull(m.getVehicleMetrics());
    }
}
