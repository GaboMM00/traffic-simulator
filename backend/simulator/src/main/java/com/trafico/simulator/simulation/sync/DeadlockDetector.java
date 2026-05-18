package com.trafico.simulator.simulation.sync;

import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.SimulationState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Monitor periódico que detecta y resuelve deadlocks entre vehículos.
 * Un deadlock ocurre cuando dos o más vehículos se bloquean mutuamente esperando
 * las intersecciones que el otro ocupa.
 *
 * Estrategia de resolución: liberar el lock del vehículo con mayor tiempo de espera
 * marcándolo como "víctima". VehicleThread consulta esta marca y abandona su espera
 * para romper el ciclo y permitir que los demás continúen.
 *
 * Algoritmo:
 * 1. Construir grafo de espera (waits-for graph)
 * 2. Detectar ciclos con DFS
 * 3. Si hay ciclo, seleccionar víctima (mayor tiempo acumulado esperando)
 * 4. Marcarla como víctima y publicar DEADLOCK_DETECTED
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlockDetector {

    private final IntersectionLock intersectionLock;
    private final EventBus eventBus;
    private final SimulationState simulationState;

    /**
     * Ejecuta una verificación de deadlocks en el estado actual de los locks.
     * Si detecta un ciclo de espera, selecciona la víctima y publica DEADLOCK_DETECTED.
     * Llamado periódicamente desde Simulator con un ScheduledExecutorService.
     */
    public void checkAndResolve() {
        // Snapshot atómico del estado actual de esperas y ocupaciones
        Map<String, String> waiting = new HashMap<>(intersectionLock.getWaitingFor());
        Map<String, String> held    = new HashMap<>(intersectionLock.getHeldBy());

        if (waiting.isEmpty()) {
            log.trace("Verificación de deadlocks: sin vehículos en espera");
            return;
        }

        // Grafo de espera: vehicleA → vehicleB significa "A espera una intersección que B ocupa"
        Map<String, String> waitsForVehicle = buildWaitsForGraph(waiting, held);

        if (waitsForVehicle.isEmpty()) return;

        // DFS para detectar ciclos en el grafo de espera
        Set<String> visited = new HashSet<>();
        List<String> cycle  = new ArrayList<>();

        for (String vehicle : waitsForVehicle.keySet()) {
            if (!visited.contains(vehicle)) {
                cycle.clear();
                if (detectCycle(vehicle, waitsForVehicle, visited, new HashSet<>(), cycle)) {
                    resolveDeadlock(cycle);
                    return; // Resolver un ciclo por verificación
                }
            }
        }

        log.trace("Verificación de deadlocks: sin ciclos detectados");
    }

    // ──────────────────────────────────────────────────────────────
    // Métodos privados
    // ──────────────────────────────────────────────────────────────

    /**
     * Construye el grafo de espera: vehicleA → vehicleB si A espera una intersección que B ocupa.
     */
    private Map<String, String> buildWaitsForGraph(Map<String, String> waiting,
                                                    Map<String, String> held) {
        Map<String, String> graph = new HashMap<>();
        for (Map.Entry<String, String> entry : waiting.entrySet()) {
            String waitingVehicle    = entry.getKey();
            String targetIntersection = entry.getValue();
            String holdingVehicle    = held.get(targetIntersection);
            if (holdingVehicle != null && !holdingVehicle.equals(waitingVehicle)) {
                graph.put(waitingVehicle, holdingVehicle);
            }
        }
        return graph;
    }

    /**
     * Búsqueda en profundidad (DFS) para detectar ciclos en el grafo de espera.
     * Los vértices en el stack de la pila actual forman el ciclo si se detecta.
     *
     * @return true si se detectó un ciclo
     */
    private boolean detectCycle(String vehicle, Map<String, String> graph,
                                 Set<String> visited, Set<String> inStack,
                                 List<String> cycleOut) {
        visited.add(vehicle);
        inStack.add(vehicle);

        String next = graph.get(vehicle);
        if (next != null) {
            if (inStack.contains(next)) {
                // Ciclo encontrado: reconstruir miembros del ciclo
                cycleOut.addAll(inStack);
                return true;
            }
            if (!visited.contains(next) && detectCycle(next, graph, visited, inStack, cycleOut)) {
                return true;
            }
        }

        inStack.remove(vehicle);
        return false;
    }

    /**
     * Resuelve el deadlock seleccionando la víctima con mayor tiempo de espera acumulado.
     * La víctima abandona su espera actual, liberando el ciclo.
     * El payload incluye la posición de la víctima y de los demás miembros del ciclo
     * para que el feed del frontend pueda mostrar exactamente dónde ocurrió el conflicto.
     */
    private void resolveDeadlock(List<String> cycleVehicles) {
        log.warn("¡Deadlock detectado! Ciclo de {} vehículos: {}", cycleVehicles.size(), cycleVehicles);

        // Seleccionar víctima: vehículo con mayor tiempo de espera acumulado
        String victim = selectVictim(cycleVehicles);
        if (victim == null) return;

        intersectionLock.markAsVictim(victim);

        Map<String, Object> payload = new HashMap<>();
        payload.put("cycleVehicles", cycleVehicles);
        payload.put("victimVehicleId", victim);

        // Posición actual de la víctima (la que abandona el lock para romper el ciclo)
        Vehicle victimVehicle = simulationState.getVehicles().get(victim);
        if (victimVehicle != null && victimVehicle.getCurrentPosition() != null) {
            payload.put("victimCol", victimVehicle.getCurrentPosition().getCol());
            payload.put("victimRow", victimVehicle.getCurrentPosition().getRow());
        }

        // Posiciones de cada vehículo del ciclo, indexadas por id
        Map<String, Map<String, Integer>> cyclePositions = new HashMap<>();
        for (String vehicleId : cycleVehicles) {
            Vehicle v = simulationState.getVehicles().get(vehicleId);
            if (v != null && v.getCurrentPosition() != null) {
                Map<String, Integer> pos = new HashMap<>();
                pos.put("col", v.getCurrentPosition().getCol());
                pos.put("row", v.getCurrentPosition().getRow());
                cyclePositions.put(vehicleId, pos);
            }
        }
        payload.put("cyclePositions", cyclePositions);

        eventBus.publish(SimulationEvent.builder()
                .type(SimulationEventType.DEADLOCK_DETECTED)
                .timestamp(simulationState.getSimulationTimeMs().get())
                .payload(payload)
                .build());
    }

    /**
     * Selecciona el vehículo del ciclo con mayor tiempo de espera acumulado.
     * Esto minimiza la penalización total: el que más esperó, cede primero.
     */
    private String selectVictim(List<String> cycleVehicles) {
        String victim    = null;
        long   maxWaitMs = -1;

        Map<String, Vehicle> vehicles = simulationState.getVehicles();
        for (String vehicleId : cycleVehicles) {
            Vehicle v = vehicles.get(vehicleId);
            if (v != null) {
                long waitMs = v.getWaitTimeMs().get();
                if (waitMs > maxWaitMs) {
                    maxWaitMs = waitMs;
                    victim    = vehicleId;
                }
            }
        }

        if (victim == null && !cycleVehicles.isEmpty()) {
            victim = cycleVehicles.get(0);
        }

        log.warn("Víctima de deadlock seleccionada: {} (espera acumulada: {}ms)", victim, maxWaitMs);
        return victim;
    }
}
