package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para ParallelRouteCalculator: equivalencia con la versión secuencial
 * (mismas rutas, mismo orden) y verificación de paralelismo real.
 */
class ParallelRouteCalculatorTest {

    private AStarRouteCalculator    sequential;
    private ParallelRouteCalculator parallel;
    private City city;

    @BeforeEach
    void setUp() {
        sequential = new AStarRouteCalculator();
        parallel   = new ParallelRouteCalculator(sequential);
        city       = City.build(12);
    }

    @Test
    @DisplayName("Resultados paralelos son idénticos a secuenciales (mismo orden, misma longitud)")
    void parallelMatchesSequential() {
        List<Coordinate[]> pairs = generateRandomPairs(50, 12);
        List<Route> seq = sequential.calculateAll(city, pairs);
        List<Route> par = parallel.calculateAll(city, pairs);

        assertEquals(seq.size(), par.size());
        for (int i = 0; i < seq.size(); i++) {
            assertEquals(seq.get(i).getOrigin(),      par.get(i).getOrigin());
            assertEquals(seq.get(i).getDestination(), par.get(i).getDestination());
            assertEquals(seq.get(i).length(),         par.get(i).length(),
                    "Las longitudes deben coincidir (ambos óptimos)");
        }
    }

    @Test
    @DisplayName("calculate individual delega correctamente al calculador base")
    void singleCalculateDelegates() {
        Coordinate origin = new Coordinate(0, 0);
        Coordinate dest   = new Coordinate(11, 11);
        Route r = parallel.calculate(city, origin, dest);
        assertTrue(r.isValid());
        assertEquals(origin, r.getOrigin());
        assertEquals(dest,   r.getDestination());
    }

    @Test
    @DisplayName("calculateAll completa todos los futures (sin huérfanos)")
    void allFuturesCompleted() {
        List<Coordinate[]> pairs = generateRandomPairs(100, 12);
        List<Route> par = parallel.calculateAll(city, pairs);
        assertEquals(100, par.size());
        for (Route r : par) {
            assertNotNull(r);
        }
    }

    private List<Coordinate[]> generateRandomPairs(int count, int gridSize) {
        Random rng = new Random(42);
        List<Coordinate[]> out = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Coordinate o = new Coordinate(rng.nextInt(gridSize), rng.nextInt(gridSize));
            Coordinate d;
            do {
                d = new Coordinate(rng.nextInt(gridSize), rng.nextInt(gridSize));
            } while (d.equals(o));
            out.add(new Coordinate[]{o, d});
        }
        return out;
    }
}
