package com.trafico.simulator.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de estado de un semáforo para el broadcast de world-state.
 * Se envía en cada tick (cada 100ms) dentro del WorldStateDTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrafficLightDTO {

    /** ID de la intersección donde está el semáforo (formato "I-col-row"). */
    private String intersectionId;

    /** Columna de la intersección en el grid. */
    private int col;

    /** Fila de la intersección en el grid. */
    private int row;

    /** Estado actual: GREEN, YELLOW, RED. */
    private String state;

    /** Milisegundos restantes en el estado actual. */
    private long remainingMs;

    /** Cantidad de vehículos esperando en esta intersección. */
    private int queueSize;

    /** Indica si el semáforo está en modo extendido (semáforo inteligente). */
    private boolean isExtended;

    /** Indica si el semáforo está en modo reducido (verde acortado o rojo acortado por demanda). */
    private boolean isReduced;
}
