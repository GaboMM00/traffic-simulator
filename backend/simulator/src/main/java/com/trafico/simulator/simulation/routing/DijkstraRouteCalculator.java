package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.Street;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

/**
 * Implementación del algoritmo Dijkstra para cálculo de rutas óptimas.
 * Garantiza el camino de costo mínimo en grafos con pesos no negativos.
 * En este modelo todos los pesos son 1, por lo que Dijkstra es equivalente a BFS.
 *
 * Se usa como referencia alternativa a A* para la comparación académica de algoritmos.
 */
@Slf4j
@Component
public class DijkstraRouteCalculator implements RouteCalculator {

    /**
     * {@inheritDoc}
     * Aplica Dijkstra (BFS para peso uniforme = 1). Complejidad O(V + E).
     * Retorna ruta vacía si no existe camino en el grafo dirigido.
     */
    @Override
    public Route calculate(City city, Coordinate origin, Coordinate destination) {
        log.debug("Calculando ruta Dijkstra desde {} hasta {}", origin.toIntersectionId(), destination.toIntersectionId());

        Intersection start = city.getIntersection(origin);
        Intersection end   = city.getIntersection(destination);

        if (start == null || end == null) {
            return Route.empty(origin, destination);
        }
        if (origin.equals(destination)) {
            return Route.of(origin, destination, List.of(origin));
        }

        Queue<String>       queue    = new ArrayDeque<>();
        Set<String>         visited  = new HashSet<>();
        Map<String, String> cameFrom = new HashMap<>();

        String startId = start.getId();
        String endId   = end.getId();

        queue.add(startId);
        visited.add(startId);
        cameFrom.put(startId, null);

        while (!queue.isEmpty()) {
            String currentId = queue.poll();

            if (currentId.equals(endId)) {
                return buildRoute(cameFrom, city, currentId, origin, destination);
            }

            Intersection current = city.getIntersectionById(currentId);
            for (Street street : current.getOutgoingStreets()) {
                String neighborId = street.getTo().getId();
                if (!visited.contains(neighborId)) {
                    visited.add(neighborId);
                    cameFrom.put(neighborId, currentId);
                    queue.add(neighborId);
                }
            }
        }

        log.warn("Dijkstra: no existe ruta entre {} y {}", origin.toIntersectionId(), destination.toIntersectionId());
        return Route.empty(origin, destination);
    }

    /**
     * {@inheritDoc}
     * Procesa cada par de coordenadas secuencialmente.
     */
    @Override
    public List<Route> calculateAll(City city, List<Coordinate[]> originDestPairs) {
        List<Route> routes = new ArrayList<>(originDestPairs.size());
        for (Coordinate[] pair : originDestPairs) {
            routes.add(calculate(city, pair[0], pair[1]));
        }
        return routes;
    }

    // ──────────────────────────────────────────────────────────────
    // Métodos privados
    // ──────────────────────────────────────────────────────────────

    /**
     * Reconstruye la ruta completa siguiendo el mapa cameFrom desde destino hasta origen.
     */
    private Route buildRoute(Map<String, String> cameFrom, City city,
                             String endId, Coordinate origin, Coordinate destination) {
        List<Coordinate> waypoints = new ArrayList<>();
        String nodeId = endId;
        while (nodeId != null) {
            waypoints.add(city.getIntersectionById(nodeId).getCoordinate());
            nodeId = cameFrom.get(nodeId);
        }
        Collections.reverse(waypoints);
        return Route.of(origin, destination, waypoints);
    }
}
