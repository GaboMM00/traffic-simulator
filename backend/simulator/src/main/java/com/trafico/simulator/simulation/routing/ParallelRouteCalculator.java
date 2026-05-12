package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ForkJoinPool;

/**
 * Calculador de rutas paralelo que envuelve a AStarRouteCalculator.
 * Usa ForkJoinPool.commonPool() para distribuir el cálculo de múltiples rutas
 * entre los hilos disponibles del procesador.
 *
 * El método calculateAll() es el punto de comparación académica: mide T_par
 * mientras que AStarRouteCalculator.calculateAll() mide T_seq.
 * El speedup esperado es proporcional al número de núcleos disponibles.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ParallelRouteCalculator implements RouteCalculator {

    /** Calculador base que se ejecuta en paralelo desde el ForkJoinPool. */
    private final AStarRouteCalculator baseCalculator;

    /**
     * {@inheritDoc}
     * Delega al calculador base para rutas individuales (no hay paralelismo en una sola ruta).
     */
    @Override
    public Route calculate(City city, Coordinate origin, Coordinate destination) {
        return baseCalculator.calculate(city, origin, destination);
    }

    /**
     * {@inheritDoc}
     * Distribuye el cálculo de todas las rutas en paralelo usando ForkJoinPool.commonPool().
     * Cada par origen-destino se convierte en un CompletableFuture independiente.
     * Los resultados se recolectan en el mismo orden que los pares de entrada.
     *
     * Este es el método que demuestra el speedup académico frente a la versión secuencial:
     * con N núcleos disponibles el speedup teórico es cercano a N.
     */
    @Override
    public List<Route> calculateAll(City city, List<Coordinate[]> originDestPairs) {
        log.debug("Calculando {} rutas en paralelo con ForkJoinPool (paralelismo={})",
                originDestPairs.size(), ForkJoinPool.commonPool().getParallelism());

        // Lanzar todos los cálculos en paralelo al ForkJoinPool
        List<CompletableFuture<Route>> futures = new ArrayList<>(originDestPairs.size());
        for (Coordinate[] pair : originDestPairs) {
            CompletableFuture<Route> future = CompletableFuture.supplyAsync(
                    () -> baseCalculator.calculate(city, pair[0], pair[1]),
                    ForkJoinPool.commonPool()
            );
            futures.add(future);
        }

        // Recolectar resultados en orden, bloqueando solo si es necesario
        List<Route> routes = new ArrayList<>(originDestPairs.size());
        for (CompletableFuture<Route> future : futures) {
            routes.add(future.join());
        }
        return routes;
    }
}
