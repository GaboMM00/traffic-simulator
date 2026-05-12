package com.trafico.simulator.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de métricas resumidas incluido en cada WorldStateDTO.
 * Contiene los contadores principales visibles en el panel lateral del frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricsDTO {

    /** Número de vehículos activos (en movimiento o esperando). */
    private int activeVehicles;

    /** Número de vehículos que ya completaron su viaje. */
    private int completedVehicles;

    /** Número de vehículos actualmente esperando en intersecciones. */
    private int waitingVehicles;

    /** ID de la intersección más congestionada en este momento. */
    private String mostCongestedIntersectionId;
}
