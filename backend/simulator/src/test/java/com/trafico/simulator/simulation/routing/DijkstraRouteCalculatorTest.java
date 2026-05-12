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
 * Tests para DijkstraRouteCalculator: equivalencia con A* en este modelo (pesos = 1)
 * y validación de rutas válidas.
 */
class DijkstraRouteCalculatorTest {

    private DijkstraRouteCalculator dijkstra;
    private AStarRouteCalculator    astar;
    private City city;

    @BeforeEach
    void setUp() {
        dijkstra = new DijkstraRouteCalculator();
        astar    = new AStarRouteCalculator();
        city     = City.build(8);
    }

    @Test
    @DisplayName("Dijkstra produce rutas con la misma longitud óptima que A*")
    void dijkstraEquivalentToAstarInLength() {
        List<Coordinate[]> pairs = List.of(
                new Coordinate[]{new Coordinate(0, 0), new Coordinate(7, 7)},
                new Coordinate[]{new Coordinate(2, 3), new Coordinate(5, 1)},
                new Coordinate[]{new Coordinate(0, 7), new Coordinate(7, 0)}
        );
        for (Coordinate[] p : pairs) {
            Route a = astar.calculate(city, p[0], p[1]);
            Route d = dijkstra.calculate(city, p[0], p[1]);
            assertTrue(a.isValid() && d.isValid());
            assertEquals(a.length(), d.length(),
                    "Ambos algoritmos deben encontrar caminos óptimos de igual longitud");
        }
    }

    @Test
    @DisplayName("Origen == destino retorna ruta unitaria")
    void singleNodeRoute() {
        Coordinate p = new Coordinate(4, 4);
        Route route = dijkstra.calculate(city, p, p);
        assertEquals(1, route.length());
    }

    @Test
    @DisplayName("calculateAll respeta el orden")
    void calculateAllOrder() {
        List<Coordinate[]> pairs = List.of(
                new Coordinate[]{new Coordinate(0, 0), new Coordinate(3, 0)},
                new Coordinate[]{new Coordinate(7, 7), new Coordinate(7, 0)}
        );
        List<Route> routes = dijkstra.calculateAll(city, pairs);
        assertEquals(2, routes.size());
        assertEquals(pairs.get(0)[1], routes.get(0).getDestination());
        assertEquals(pairs.get(1)[1], routes.get(1).getDestination());
    }
}
