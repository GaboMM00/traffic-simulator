package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.Street;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

/**
 * Implementación del algoritmo A* para cálculo de rutas óptimas.
 * Usa la distancia Manhattan como heurística admisible, lo que garantiza optimalidad.
 * Ejecución completamente secuencial en el hilo que lo invoca.
 *
 * El grafo es dirigido (sistema Manhattan alternado), por lo que se recorren
 * únicamente las calles salientes de cada intersección.
 */
@Slf4j
@Component
public class AStarRouteCalculator implements RouteCalculator {

    /**
     * Nodo interno de la cola de prioridad. Contiene el ID de la intersección
     * y su puntuación f = g + h para ordenar la exploración.
     */
    private record AStarNode(String id, int fScore) implements Comparable<AStarNode> {
        @Override
        public int compareTo(AStarNode other) {
            return Integer.compare(this.fScore, other.fScore);
        }
    }

    /**
     * {@inheritDoc}
     * Aplica A* con heurística Manhattan. Complejidad O((V + E) log V).
     * Retorna ruta vacía si no existe camino en el grafo dirigido.
     */
    @Override
    public Route calculate(City city, Coordinate origin, Coordinate destination) {
        log.debug("Calculando ruta A* desde {} hasta {}", origin.toIntersectionId(), destination.toIntersectionId());

        Intersection start = city.getIntersection(origin);
        Intersection end   = city.getIntersection(destination);

        if (start == null || end == null) {
            return Route.empty(origin, destination);
        }
        if (origin.equals(destination)) {
            return Route.of(origin, destination, List.of(origin));
        }

        PriorityQueue<AStarNode> openSet    = new PriorityQueue<>();
        Map<String, Integer>     gScore     = new HashMap<>();
        Map<String, String>      cameFrom   = new HashMap<>();
        Set<String>              closedSet  = new HashSet<>();

        String startId = start.getId();
        String endId   = end.getId();

        gScore.put(startId, 0);
        openSet.add(new AStarNode(startId, heuristic(origin, destination)));

        while (!openSet.isEmpty()) {
            AStarNode current = openSet.poll();
            String currentId = current.id();

            if (closedSet.contains(currentId)) continue;
            if (currentId.equals(endId)) {
                return buildRoute(cameFrom, city, currentId, origin, destination);
            }

            closedSet.add(currentId);
            Intersection currentIntersection = city.getIntersectionById(currentId);
            int currentG = gScore.getOrDefault(currentId, Integer.MAX_VALUE);

            for (Street street : currentIntersection.getOutgoingStreets()) {
                Intersection neighbor = street.getTo();
                String neighborId = neighbor.getId();

                if (closedSet.contains(neighborId)) continue;

                // Todos los pesos son 1 (peso de la calle = 1 paso)
                int tentativeG = currentG + 1;

                if (tentativeG < gScore.getOrDefault(neighborId, Integer.MAX_VALUE)) {
                    cameFrom.put(neighborId, currentId);
                    gScore.put(neighborId, tentativeG);
                    int f = tentativeG + heuristic(neighbor.getCoordinate(), destination);
                    openSet.add(new AStarNode(neighborId, f));
                }
            }
        }

        log.warn("A*: no existe ruta entre {} y {}", origin.toIntersectionId(), destination.toIntersectionId());
        return Route.empty(origin, destination);
    }

    /**
     * {@inheritDoc}
     * Procesa cada par de coordenadas secuencialmente, uno a uno.
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
     * Heurística admisible: distancia Manhattan entre dos coordenadas.
     * Nunca sobreestima el costo real porque los arcos tienen peso 1.
     */
    private int heuristic(Coordinate a, Coordinate b) {
        return Math.abs(a.getCol() - b.getCol()) + Math.abs(a.getRow() - b.getRow());
    }

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
