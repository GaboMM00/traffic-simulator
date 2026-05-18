package com.trafico.simulator.metrics;

import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.simulation.SimulationState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;

/**
 * Recolecta y agrega métricas de la simulación a partir de un {@link SimulationState}.
 *
 * Dispone de dos variantes de cada método:
 * - Sin parámetro: usa el {@code SimulationState} inyectado por Spring (backwards compat).
 * - Con parámetro {@code SimulationState}: permite consultar cualquier runner independiente.
 *
 * La segunda variante es usada por {@link com.trafico.simulator.websocket.SimulationBroadcaster}
 * y {@link com.trafico.simulator.controller.SimulationController} para acceder al estado
 * de cada runner en la simulación dual (SEQ + PAR).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsCollector {

    private final SimulationState simulationState;

    /** Snapshot periódico del estado actual (para el runner inyectado por Spring). */
    public SimulationMetrics collect() {
        return buildMetrics(simulationState, false);
    }

    /** Snapshot periódico usando un SimulationState específico (runner SEQ o PAR). */
    public SimulationMetrics collect(SimulationState state) {
        return buildMetrics(state, false);
    }

    /** Métricas finales con detalle por vehículo (para el runner inyectado por Spring). */
    public SimulationMetrics collectFinal() {
        return buildMetrics(simulationState, true);
    }

    /** Métricas finales con detalle por vehículo para un runner específico. */
    public SimulationMetrics collectFinal(SimulationState state) {
        SimulationMetrics metrics = buildMetrics(state, true);
        log.info("Métricas finales [{}] — completados={}, avgTravel={:.0f}ms, seq={}ms, par={}ms",
                state.getSimulationId(),
                metrics.getCompletedVehicles(), metrics.getAverageTravelTimeMs(),
                metrics.getSequentialRouteTimeMs(), metrics.getParallelRouteTimeMs());
        return metrics;
    }

    /** Lista de métricas por vehículo (sin contar NO_ROUTE), usando el state inyectado. */
    public List<VehicleMetrics> collectVehicleMetrics() {
        return collectVehicleMetrics(simulationState);
    }

    /** Lista de métricas por vehículo para un runner específico. */
    public List<VehicleMetrics> collectVehicleMetrics(SimulationState state) {
        return state.getVehicles().values().stream()
                .filter(v -> !v.hasNoRoute())
                .map(v -> VehicleMetrics.builder()
                        .vehicleId(v.getId())
                        .arrivalOrder(v.getArrivalOrder())
                        .travelTimeMs(v.getTravelTimeMs())
                        .waitTimeMs(v.getWaitTimeMs().get())
                        .waitTimePercent(v.getWaitTimePercent())
                        .routeLength(v.getRoute() != null ? v.getRoute().getWaypoints().size() : 0)
                        .completed(v.isCompleted())
                        .build())
                .sorted(Comparator.comparingInt(vm -> vm.getArrivalOrder() < 0
                        ? Integer.MAX_VALUE : vm.getArrivalOrder()))
                .toList();
    }

    // ──────────────────────────────────────────────────────────────

    private SimulationMetrics buildMetrics(SimulationState state, boolean includeVehicleDetail) {
        Collection<Vehicle> vehicles = state.getVehicles().values();

        int active    = (int) vehicles.stream().filter(v -> v.getState() == VehicleState.MOVING
                                                         || v.getState() == VehicleState.CALCULATING).count();
        int completed = (int) vehicles.stream().filter(Vehicle::isCompleted).count();
        int waiting   = (int) vehicles.stream().filter(v -> v.getState() == VehicleState.WAITING).count();

        List<Vehicle> completedList = vehicles.stream()
                .filter(Vehicle::isCompleted)
                .toList();

        double avgTravel = completedList.stream()
                .mapToLong(Vehicle::getTravelTimeMs)
                .average()
                .orElse(0.0);

        Vehicle lead = completedList.stream()
                .min(Comparator.comparingLong(Vehicle::getTravelTimeMs))
                .orElse(null);

        String leadId           = lead != null ? lead.getId() : null;
        long   leadTravelTimeMs = lead != null ? lead.getTravelTimeMs() : 0L;

        String congestedId    = null;
        int    congestedWaits = 0;
        if (state.getCity() != null) {
            Intersection top = state.getCity().getMostCongestedIntersection();
            if (top != null) {
                congestedId    = top.getId();
                congestedWaits = top.getWaitCount().get();
            }
        }

        long seqMs = state.getSequentialRouteTimeMs();
        long parMs = state.getParallelRouteTimeMs();
        long seqNs = state.getSequentialRouteTimeNs();
        long parNs = state.getParallelRouteTimeNs();
        // El speedup usa los nanosegundos cuando estén disponibles (precisión sub-ms);
        // fallback a los milisegundos si los Ns son 0 (estados legacy o tests).
        Double speedup;
        if (parNs > 0) {
            speedup = (double) seqNs / parNs;
        } else if (parMs > 0) {
            speedup = (double) seqMs / parMs;
        } else {
            speedup = null;
        }

        List<VehicleMetrics> detail = includeVehicleDetail ? collectVehicleMetrics(state) : null;

        return SimulationMetrics.builder()
                .activeVehicles(active)
                .completedVehicles(completed)
                .waitingVehicles(waiting)
                .averageTravelTimeMs(avgTravel)
                .leadVehicleId(leadId)
                .leadVehicleTravelTimeMs(leadTravelTimeMs)
                .mostCongestedIntersectionId(congestedId)
                .mostCongestedIntersectionWaits(congestedWaits)
                .sequentialRouteTimeMs(seqMs)
                .parallelRouteTimeMs(parMs)
                .sequentialRouteTimeNs(seqNs)
                .parallelRouteTimeNs(parNs)
                .speedup(speedup)
                .vehicleMetrics(detail)
                .build();
    }
}
