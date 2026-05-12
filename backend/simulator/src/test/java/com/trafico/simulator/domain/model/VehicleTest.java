package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.valueobject.Coordinate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para Vehicle: estado inicial, métricas de tiempo y porcentaje de espera.
 */
class VehicleTest {

    @Test
    @DisplayName("Vehículo recién creado está en estado CALCULATING con métricas en cero")
    void initialStateIsCalculating() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        assertEquals(VehicleState.CALCULATING, v.getState());
        assertEquals(0L, v.getWaitTimeMs().get());
        assertEquals(0L, v.getTravelTimeMs());
        assertEquals(-1, v.getArrivalOrder());
        assertFalse(v.isCompleted());
        assertFalse(v.hasNoRoute());
        assertFalse(v.isLeader());
    }

    @Test
    @DisplayName("addWaitTime acumula correctamente y getWaitTimePercent calcula el ratio")
    void waitTimeMetrics() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        v.addWaitTime(2000);
        v.addWaitTime(3000);
        assertEquals(5000L, v.getWaitTimeMs().get());

        v.setTravelTimeMs(10000);
        assertEquals(50.0, v.getWaitTimePercent(), 0.001);
    }

    @Test
    @DisplayName("getWaitTimePercent retorna 0 si travelTimeMs es 0 (no divide por cero)")
    void waitPercentZeroSafeguard() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        v.addWaitTime(500);
        assertEquals(0.0, v.getWaitTimePercent(), 0.001);
    }

    @Test
    @DisplayName("isLeader es true solo si arrivalOrder == 1")
    void leaderBadge() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        v.setArrivalOrder(2);
        assertFalse(v.isLeader());
        v.setArrivalOrder(1);
        assertTrue(v.isLeader());
    }

    @Test
    @DisplayName("isCompleted/hasNoRoute reflejan el estado actual")
    void stateChecks() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        v.setState(VehicleState.COMPLETED);
        assertTrue(v.isCompleted());
        v.setState(VehicleState.NO_ROUTE);
        assertTrue(v.hasNoRoute());
    }

    @Test
    @DisplayName("Posición y dirección son volatile-mutables tras construcción")
    void positionMutability() {
        Vehicle v = new Vehicle("V-001", 0, 0L);
        Coordinate p = new Coordinate(3, 4);
        v.setCurrentPosition(p);
        v.setPreviousPosition(new Coordinate(2, 4));
        assertEquals(p, v.getCurrentPosition());
        assertEquals(new Coordinate(2, 4), v.getPreviousPosition());
    }
}
