package com.trafico.simulator.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para Route: factory methods, validez, longitud e inmutabilidad.
 */
class RouteTest {

    @Test
    @DisplayName("Route.of crea una ruta válida con waypoints inmutables")
    void createValidRoute() {
        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(2, 0);
        List<Coordinate> waypoints = List.of(origin, new Coordinate(1, 0), dest);

        Route route = Route.of(origin, dest, waypoints);

        assertTrue(route.isValid());
        assertEquals(3, route.length());
        assertEquals(origin, route.getOrigin());
        assertEquals(dest,   route.getDestination());
        assertThrows(UnsupportedOperationException.class,
                () -> route.getWaypoints().add(new Coordinate(9, 9)),
                "Los waypoints deben ser inmutables");
    }

    @Test
    @DisplayName("Route.empty representa NO_ROUTE (no es válida y tiene longitud 0)")
    void emptyRoute() {
        Route route = Route.empty(new Coordinate(0, 0), new Coordinate(5, 5));
        assertFalse(route.isValid());
        assertEquals(0, route.length());
        assertTrue(route.getWaypoints().isEmpty());
    }
}
