package com.trafico.simulator.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta de POST /api/simulation/start.
 * Confirma al frontend el ID de la simulación y los metadatos iniciales para mostrar
 * la pantalla de carga.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartSimulationResponse {

    /** ID generado de la simulación (formato "SIM-yyyyMMdd-HHmmss"). */
    private String simulationId;

    /** Estado inmediato tras el inicio. Siempre "LOADING" en esta etapa. */
    private String status;

    /** Tamaño del grid de la simulación recién iniciada. */
    private int gridSize;

    /** Número de vehículos creados. */
    private int vehicleCount;

    /** Número de semáforos generados por la ciudad. */
    private int trafficLightCount;

    /** Estimación heurística del tiempo de inicialización en ms (fijo: 800ms). */
    private long estimatedLoadTimeMs;
}
