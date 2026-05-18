package com.trafico.simulator.controller.dto;

import com.trafico.simulator.metrics.VehicleMetrics;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Respuesta completa de POST /api/simulation/stop.
 * Contiene los resultados de las dos simulaciones simultáneas (SEQUENTIAL y PARALLEL)
 * junto con la comparación del benchmark de rutas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StopSimulationResponse {

    private String          simulationId;
    private LocalDateTime   completedAt;
    /** Duración en ms del runner que más tardó (max de SEQ y PAR). */
    private long            totalDurationMs;
    /** Tiempos de benchmark de rutas (medidos una vez para ambos modos). */
    private RouteCalculation routeCalculation;
    /** Resultados del runner SEQUENTIAL. */
    private RunResult       sequential;
    /** Resultados del runner PARALLEL. */
    private RunResult       parallel;

    /**
     * Comparación de tiempos de cálculo de rutas (benchmark pre-simulación).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteCalculation {
        private long   sequentialTimeMs;
        private long   parallelTimeMs;
        private Double speedup;
    }

    /**
     * Resultado completo de un runner individual (SEQ o PAR).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunResult {
        private long                durationMs;
        private List<VehicleMetrics> vehicles;
        private Summary             summary;
        /**
         * Estadísticas de semáforos inteligentes. Null si {@code smartTrafficLights} estaba
         * desactivado en este runner. La UI muestra una sección extra solo si está presente.
         */
        private SmartLightStats     smartLightStats;
    }

    /**
     * Contadores agregados de actividad de los semáforos inteligentes en este runner.
     * Se incluye en {@link RunResult} únicamente cuando smartTrafficLights estaba activo.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SmartLightStats {
        /** Veces que algún semáforo extendió el verde por congestión persistente. */
        private int totalGreenExtensions;
        /** Veces que algún semáforo recortó el verde porque la cola se vació. */
        private int totalGreenReductions;
        /** Veces que algún semáforo recortó el rojo por congestión crítica. */
        private int totalRedReductions;
    }

    /**
     * Resumen agregado de un runner.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private String firstVehicleId;
        private long   firstVehicleTravelTimeMs;
        private double averageTravelTimeMs;
        private double averageWaitTimeMs;
        private double averageWaitTimePercent;
        private int    totalCompleted;
        private int    totalVehicles;
        private String mostCongestedIntersectionId;
        private int    mostCongestedIntersectionWaits;
    }
}
