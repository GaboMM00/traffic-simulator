package com.trafico.simulator.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para Coordinate: identidad, validación de límites y detección de borde.
 */
class CoordinateTest {

    @Test
    @DisplayName("toIntersectionId genera el formato I-{col}-{row} correcto")
    void toIntersectionIdFormat() {
        assertEquals("I-0-0", new Coordinate(0, 0).toIntersectionId());
        assertEquals("I-4-7", new Coordinate(4, 7).toIntersectionId());
        assertEquals("I-11-11", new Coordinate(11, 11).toIntersectionId());
    }

    @Test
    @DisplayName("isValid acepta coordenadas dentro del grid y rechaza fuera")
    void isValidWithinGrid() {
        assertTrue(new Coordinate(0, 0).isValid(12));
        assertTrue(new Coordinate(11, 11).isValid(12));
        assertFalse(new Coordinate(12, 0).isValid(12));
        assertFalse(new Coordinate(0, 12).isValid(12));
        assertFalse(new Coordinate(-1, 0).isValid(12));
        assertFalse(new Coordinate(0, -1).isValid(12));
    }

    @Test
    @DisplayName("isBorder identifica los 4 lados del grid")
    void isBorderForAllSides() {
        int gridSize = 12;
        assertTrue(new Coordinate(0, 5).isBorder(gridSize), "Borde izquierdo (col=0)");
        assertTrue(new Coordinate(11, 5).isBorder(gridSize), "Borde derecho (col=N-1)");
        assertTrue(new Coordinate(5, 0).isBorder(gridSize), "Borde superior (row=0)");
        assertTrue(new Coordinate(5, 11).isBorder(gridSize), "Borde inferior (row=N-1)");
        assertFalse(new Coordinate(5, 5).isBorder(gridSize), "Centro no es borde");
        assertFalse(new Coordinate(6, 6).isBorder(gridSize), "Otro nodo central no es borde");
    }

    @Test
    @DisplayName("Equals e hashCode funcionan por valor (Lombok @Value)")
    void valueEquality() {
        assertEquals(new Coordinate(3, 4), new Coordinate(3, 4));
        assertEquals(new Coordinate(3, 4).hashCode(), new Coordinate(3, 4).hashCode());
        assertNotEquals(new Coordinate(3, 4), new Coordinate(4, 3));
    }
}
