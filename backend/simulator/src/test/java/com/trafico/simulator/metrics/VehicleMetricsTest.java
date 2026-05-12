package com.trafico.simulator.metrics;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para VehicleMetrics: construcción y cálculo de waitTimePercent.
 */
class VehicleMetricsTest {

    @Test
    @DisplayName("Builder asigna todos los campos correctamente")
    void builderSetsAllFields() {
        VehicleMetrics vm = VehicleMetrics.builder()
                .vehicleId("V-001")
                .arrivalOrder(2)
                .travelTimeMs(4000L)
                .waitTimeMs(1000L)
                .waitTimePercent(25.0)
                .routeLength(8)
                .completed(true)
                .build();

        assertEquals("V-001", vm.getVehicleId());
        assertEquals(2,       vm.getArrivalOrder());
        assertEquals(4000L,   vm.getTravelTimeMs());
        assertEquals(1000L,   vm.getWaitTimeMs());
        assertEquals(25.0,    vm.getWaitTimePercent(), 0.001);
        assertEquals(8,       vm.getRouteLength());
        assertTrue(vm.isCompleted());
    }

    @Test
    @DisplayName("No-args constructor produce objeto con valores por defecto")
    void noArgConstructorDefaults() {
        VehicleMetrics vm = new VehicleMetrics();
        assertNull(vm.getVehicleId());
        assertEquals(0, vm.getArrivalOrder());
        assertFalse(vm.isCompleted());
    }

    @Test
    @DisplayName("Vehículo no completado tiene arrivalOrder -1 y completed=false")
    void incompleteVehicle() {
        VehicleMetrics vm = VehicleMetrics.builder()
                .vehicleId("V-005")
                .arrivalOrder(-1)
                .travelTimeMs(0L)
                .completed(false)
                .build();

        assertEquals(-1, vm.getArrivalOrder());
        assertFalse(vm.isCompleted());
    }
}
