package com.trafico.simulator.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta de GET /api/simulation/status.
 * Permite al frontend reconciliar su estado tras una reconexión o al cargar la página.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusResponse {

    /** Estado actual: "IDLE", "RUNNING", "PAUSED" o "STOPPED". */
    private String status;

    /** ID de la simulación activa, null si no hay ninguna. */
    private String simulationId;

    /** Tamaño del grid de la simulación activa, 0 si no hay ninguna. */
    private int gridSize;

    /** Número de vehículos de la simulación activa, 0 si no hay ninguna. */
    private int vehicleCount;

    /** Tiempo de simulación transcurrido en ms. */
    private long simulationTimeMs;

    /** Vehículos completados hasta el momento. */
    private int completedVehicles;
}
