package com.trafico.simulator.controller;

import com.trafico.simulator.controller.dto.StartSimulationRequest;
import com.trafico.simulator.controller.dto.StartSimulationResponse;
import com.trafico.simulator.controller.dto.StatusResponse;
import com.trafico.simulator.controller.dto.StopSimulationResponse;
import com.trafico.simulator.domain.enums.ExecutionMode;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.metrics.MetricsCollector;
import com.trafico.simulator.metrics.SimulationMetrics;
import com.trafico.simulator.metrics.VehicleMetrics;
import com.trafico.simulator.simulation.SimulationRunner;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.Simulator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Controller REST que expone los endpoints de control de la simulación dual (SEQ + PAR).
 * Recibe comandos del frontend y los delega al Simulator, que a su vez los propaga
 * a ambos runners (SEQUENTIAL y PARALLEL).
 */
@Slf4j
@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private static final long ESTIMATED_LOAD_MS = 800L;

    private final Simulator        simulator;
    private final MetricsCollector metricsCollector;

    @PostMapping("/start")
    public ResponseEntity<StartSimulationResponse> start(@RequestBody StartSimulationRequest request) {
        log.info("POST /api/simulation/start — gridSize={}, vehicleCount={} (modo DUAL: SEQ+PAR)",
                request.getGridSize(), request.getVehicleCount());

        SimulationParams params = mapToParams(request);
        String simId = simulator.start(params);

        int trafficLightCount = 0;
        int effectiveVehicleCount = params.getVehicleCount();
        if (simulator.getParRunner() != null && simulator.getParRunner().getState().getCity() != null) {
            SimulationState parState = simulator.getParRunner().getState();
            trafficLightCount = parState.getCity().getAllTrafficLights().size();
            // En modo manual el conteo se deriva de los vehículos efectivamente creados.
            // Si el state aún no tiene vehículos (p.ej. en tests con mocks), conservamos el del request.
            int realCount = parState.getVehicles().size();
            if (realCount > 0) effectiveVehicleCount = realCount;
        }

        StartSimulationResponse response = StartSimulationResponse.builder()
                .simulationId(simId)
                .status("LOADING")
                .gridSize(params.getGridSize())
                .vehicleCount(effectiveVehicleCount)
                .trafficLightCount(trafficLightCount)
                .estimatedLoadTimeMs(ESTIMATED_LOAD_MS)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, String>> pause() {
        simulator.pause();
        return ResponseEntity.ok(Map.of("status", "paused"));
    }

    @PostMapping("/resume")
    public ResponseEntity<Map<String, String>> resume() {
        simulator.resume();
        return ResponseEntity.ok(Map.of("status", "running"));
    }

    /**
     * Detiene ambas simulaciones y devuelve los resultados combinados.
     * La respuesta incluye resultados separados para el runner SEQ y PAR.
     */
    @PostMapping("/stop")
    public ResponseEntity<StopSimulationResponse> stop() {
        SimulationRunner seqRunner = simulator.getSeqRunner();
        SimulationRunner parRunner = simulator.getParRunner();

        SimulationState seqState = seqRunner != null ? seqRunner.getState() : new SimulationState();
        SimulationState parState = parRunner != null ? parRunner.getState() : new SimulationState();

        SimulationMetrics seqMetrics = metricsCollector.collectFinal(seqState);
        SimulationMetrics parMetrics = metricsCollector.collectFinal(parState);

        long seqDurationMs = seqState.getSimulationTimeMs().get();
        long parDurationMs = parState.getSimulationTimeMs().get();
        long totalDurationMs = Math.max(seqDurationMs, parDurationMs);

        simulator.stop();

        StopSimulationResponse.RouteCalculation routeCalc = StopSimulationResponse.RouteCalculation.builder()
                .sequentialTimeMs(seqMetrics.getSequentialRouteTimeMs())
                .parallelTimeMs(seqMetrics.getParallelRouteTimeMs())
                .speedup(seqMetrics.getSpeedup())
                .build();

        StopSimulationResponse response = StopSimulationResponse.builder()
                .simulationId(simulator.getSimulationId())
                .completedAt(LocalDateTime.now())
                .totalDurationMs(totalDurationMs)
                .routeCalculation(routeCalc)
                .sequential(buildRunResult(seqMetrics, seqState, seqDurationMs))
                .parallel(buildRunResult(parMetrics, parState, parDurationMs))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<StatusResponse> status() {
        boolean running = simulator.isRunning();
        boolean paused  = simulator.isPaused();
        String  simId   = simulator.getSimulationId();

        String state;
        if (running && paused) state = "PAUSED";
        else if (running)      state = "RUNNING";
        else if (simId != null) state = "STOPPED";
        else                    state = "IDLE";

        int gridSize     = 0;
        int vehicleCount = 0;
        long simTimeMs   = 0;
        int completed    = 0;

        SimulationRunner par = simulator.getParRunner();
        if (par != null) {
            SimulationState s = par.getState();
            if (s.getParams() != null) {
                gridSize     = s.getParams().getGridSize();
                vehicleCount = s.getParams().getVehicleCount();
            }
            simTimeMs = s.getSimulationTimeMs().get();
            completed = s.getCompletedVehicles().get();
        }

        StatusResponse response = StatusResponse.builder()
                .status(state)
                .simulationId(simId)
                .gridSize(gridSize)
                .vehicleCount(vehicleCount)
                .simulationTimeMs(simTimeMs)
                .completedVehicles(completed)
                .build();
        return ResponseEntity.ok(response);
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers privados
    // ──────────────────────────────────────────────────────────────

    private SimulationParams mapToParams(StartSimulationRequest req) {
        SimulationParams defaults = SimulationParams.defaults();
        StartSimulationRequest.TrafficLightConfig tl = req.getTrafficLight();

        List<Coordinate[]> manualPairs = mapManualPairs(req.getManualVehicles(),
                req.getGridSize() != null ? req.getGridSize() : defaults.getGridSize());

        return SimulationParams.builder()
                .gridSize(req.getGridSize() != null ? req.getGridSize() : defaults.getGridSize())
                .vehicleCount(req.getVehicleCount() != null ? req.getVehicleCount() : defaults.getVehicleCount())
                // executionMode ignorado: siempre se ejecutan ambos modos
                .executionMode(ExecutionMode.PARALLEL)
                .greenDurationMs(tl != null && tl.getGreenDurationMs() != null
                        ? tl.getGreenDurationMs() : defaults.getGreenDurationMs())
                .yellowDurationMs(tl != null && tl.getYellowDurationMs() != null
                        ? tl.getYellowDurationMs() : defaults.getYellowDurationMs())
                .redDurationMs(tl != null && tl.getRedDurationMs() != null
                        ? tl.getRedDurationMs() : defaults.getRedDurationMs())
                .simulationSpeed(req.getSimulationSpeed() != null
                        ? req.getSimulationSpeed() : defaults.getSimulationSpeed())
                .smartTrafficLights(req.getSmartTrafficLights() != null
                        ? req.getSmartTrafficLights() : defaults.isSmartTrafficLights())
                .manualPairs(manualPairs)
                .build();
    }

    /**
     * Convierte la lista de vehículos manuales del request a la lista de pares Coordinate[2]
     * que consume {@link SimulationParams#getManualPairs()}. Aplica validaciones básicas:
     * <ul>
     *   <li>Solo orígenes en el borde (descarta los que no lo son).</li>
     *   <li>Origen distinto a destino (descarta pares iguales).</li>
     *   <li>Coordenadas dentro del grid (descarta fuera de rango).</li>
     * </ul>
     * Si la lista resultante es vacía, retorna null para activar el modo automático.
     *
     * @param manualVehicles lista del request (puede ser null si modo automático)
     * @param gridSize       tamaño del grid para validar coordenadas
     * @return lista de pares válidos, o null si la lista original era vacía/null
     */
    private List<Coordinate[]> mapManualPairs(
            List<StartSimulationRequest.ManualVehiclePair> manualVehicles, int gridSize) {
        if (manualVehicles == null || manualVehicles.isEmpty()) return null;

        List<Coordinate[]> pairs = new ArrayList<>(manualVehicles.size());
        for (StartSimulationRequest.ManualVehiclePair mv : manualVehicles) {
            if (mv == null
                    || mv.getOriginCol() == null || mv.getOriginRow() == null
                    || mv.getDestCol() == null   || mv.getDestRow() == null) {
                log.warn("Vehículo manual con coordenadas incompletas, ignorado: {}", mv);
                continue;
            }
            Coordinate origin = new Coordinate(mv.getOriginCol(), mv.getOriginRow());
            Coordinate dest   = new Coordinate(mv.getDestCol(),   mv.getDestRow());
            if (!origin.isValid(gridSize) || !dest.isValid(gridSize)) {
                log.warn("Vehículo manual fuera del grid {}x{}, ignorado: {} → {}",
                        gridSize, gridSize, origin, dest);
                continue;
            }
            if (!origin.isBorder(gridSize)) {
                log.warn("Vehículo manual con origen fuera del borde, ignorado: {} → {}", origin, dest);
                continue;
            }
            if (origin.equals(dest)) {
                log.warn("Vehículo manual con origen=destino, ignorado: {}", origin);
                continue;
            }
            pairs.add(new Coordinate[]{origin, dest});
        }
        return pairs.isEmpty() ? null : pairs;
    }

    private StopSimulationResponse.RunResult buildRunResult(SimulationMetrics metrics,
                                                             SimulationState state,
                                                             long durationMs) {
        List<VehicleMetrics> vehicleMetrics = metrics.getVehicleMetrics() != null
                ? metrics.getVehicleMetrics() : List.of();

        double avgWaitMs  = vehicleMetrics.stream()
                .filter(VehicleMetrics::isCompleted)
                .mapToLong(VehicleMetrics::getWaitTimeMs)
                .average().orElse(0.0);
        double avgWaitPct = vehicleMetrics.stream()
                .filter(VehicleMetrics::isCompleted)
                .mapToDouble(VehicleMetrics::getWaitTimePercent)
                .average().orElse(0.0);

        StopSimulationResponse.Summary summary = StopSimulationResponse.Summary.builder()
                .firstVehicleId(metrics.getLeadVehicleId())
                .firstVehicleTravelTimeMs(metrics.getLeadVehicleTravelTimeMs())
                .averageTravelTimeMs(metrics.getAverageTravelTimeMs())
                .averageWaitTimeMs(avgWaitMs)
                .averageWaitTimePercent(avgWaitPct)
                .totalCompleted(metrics.getCompletedVehicles())
                .totalVehicles(state.getVehicles().size())
                .mostCongestedIntersectionId(metrics.getMostCongestedIntersectionId())
                .mostCongestedIntersectionWaits(metrics.getMostCongestedIntersectionWaits())
                .build();

        StopSimulationResponse.SmartLightStats smartStats = null;
        if (state.getParams() != null && state.getParams().isSmartTrafficLights()) {
            smartStats = StopSimulationResponse.SmartLightStats.builder()
                    .totalGreenExtensions(state.getTotalGreenExtensions().get())
                    .totalGreenReductions(state.getTotalGreenReductions().get())
                    .totalRedReductions(state.getTotalRedReductions().get())
                    .build();
        }

        return StopSimulationResponse.RunResult.builder()
                .durationMs(durationMs)
                .vehicles(vehicleMetrics)
                .summary(summary)
                .smartLightStats(smartStats)
                .build();
    }
}
