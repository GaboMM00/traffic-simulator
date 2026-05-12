package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para AStarRouteCalculator: optimalidad de rutas, casos edge y conectividad
 * en el grafo dirigido de Manhattan alternado.
 */
class AStarRouteCalculatorTest {

    private AStarRouteCalculator calculator;
    private City city;

    @BeforeEach
    void setUp() {
        calculator = new AStarRouteCalculator();
        city = City.build(8);
    }

    @Test
    @DisplayName("Origen == destino retorna ruta de un solo nodo")
    void sameOriginAndDestination() {
        Coordinate p = new Coordinate(2, 3);
        Route route = calculator.calculate(city, p, p);
        assertTrue(route.isValid());
        assertEquals(1, route.length());
        assertEquals(p, route.getWaypoints().get(0));
    }

    @Test
    @DisplayName("La ruta empieza en el origen y termina en el destino")
    void pathStartsAtOriginEndsAtDestination() {
        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(7, 7);
        Route route = calculator.calculate(city, origin, dest);
        assertTrue(route.isValid());
        assertEquals(origin, route.getWaypoints().get(0));
        assertEquals(dest,   route.getWaypoints().get(route.length() - 1));
    }

    @Test
    @DisplayName("La ruta es óptima en pasos (Manhattan distance + 1 nodos en grid bien orientado)")
    void optimalPathLength() {
        // De (0,0) a (3,0): 3 pasos en EAST, 4 nodos
        Route route = calculator.calculate(city,
                new Coordinate(0, 0), new Coordinate(3, 0));
        assertEquals(4, route.length());
    }

    @Test
    @DisplayName("Cada par de waypoints consecutivos debe estar conectado por una calle dirigida")
    void everyConsecutivePairIsConnected() {
        Route route = calculator.calculate(city,
                new Coordinate(0, 0), new Coordinate(7, 7));
        List<Coordinate> wp = route.getWaypoints();

        for (int i = 0; i < wp.size() - 1; i++) {
            var from = city.getIntersection(wp.get(i));
            var to   = city.getIntersection(wp.get(i + 1));
            assertNotNull(from.getStreetTo(to),
                    "No existe calle dirigida desde " + wp.get(i) + " hacia " + wp.get(i + 1));
        }
    }

    @Test
    @DisplayName("Conectividad total en grids 8, 12 y 16 — ningún par retorna NO_ROUTE")
    void allPairsReachableInVariousGrids() {
        for (int size : new int[]{8, 12, 16}) {
            City c = City.build(size);
            Coordinate origin = new Coordinate(0, 0);
            Coordinate dest   = new Coordinate(size - 1, size - 1);
            Route route = calculator.calculate(c, origin, dest);
            assertTrue(route.isValid(),
                    "Debe existir ruta de (0,0) a esquina opuesta en grid " + size);
        }
    }

    @Test
    @DisplayName("calculateAll preserva el orden de los pares de entrada")
    void calculateAllPreservesOrder() {
        List<Coordinate[]> pairs = List.of(
                new Coordinate[]{new Coordinate(0, 0), new Coordinate(2, 2)},
                new Coordinate[]{new Coordinate(7, 7), new Coordinate(0, 0)},
                new Coordinate[]{new Coordinate(3, 4), new Coordinate(5, 1)}
        );
        List<Route> routes = calculator.calculateAll(city, pairs);
        assertEquals(3, routes.size());
        for (int i = 0; i < pairs.size(); i++) {
            assertEquals(pairs.get(i)[0], routes.get(i).getOrigin());
            assertEquals(pairs.get(i)[1], routes.get(i).getDestination());
        }
    }
}
