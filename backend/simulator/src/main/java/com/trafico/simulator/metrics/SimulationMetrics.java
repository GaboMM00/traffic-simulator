package com.trafico.simulator.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Snapshot de métricas de la simulación en un instante determinado.
 * Se genera periódicamente por MetricsCollector y se envía al frontend vía WebSocket.
 * En el evento SIMULATION_FINISHED también incluye la lista completa de vehicleMetrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationMetrics {

    /** Vehículos que están actualmente en movimiento o esperando. */
    private int activeVehicles;

    /** Vehículos que ya completaron su viaje. */
    private int completedVehicles;

    /** Vehículos detenidos esperando en intersecciones ahora mismo. */
    private int waitingVehicles;

    /** ID de la intersección con más esperas acumuladas. */
    private String mostCongestedIntersectionId;

    /** Número de esperas en la intersección más congestionada. */
    private int mostCongestedIntersectionWaits;

    /** ID del vehículo con menor tiempo de viaje completado (líder). */
    private String leadVehicleId;

    /** Tiempo de viaje del vehículo líder en milisegundos. */
    private long leadVehicleTravelTimeMs;

    /** Tiempo promedio de viaje de los vehículos completados hasta ahora. */
    private double averageTravelTimeMs;

    /** Tiempo que tomó calcular rutas en secuencial (para comparación). */
    private long sequentialRouteTimeMs;

    /** Tiempo que tomó calcular rutas en paralelo (para comparación). */
    private long parallelRouteTimeMs;

    /**
     * Speedup = T_seq / T_par. Null si T_par == 0.
     * Valor académico central de la comparación paralelo vs secuencial.
     */
    private Double speedup;

    /**
     * Métricas individuales por vehículo. Solo se incluye en collectFinal();
     * en snapshots periódicos este campo es null para reducir el payload.
     */
    private List<VehicleMetrics> vehicleMetrics;
}
