package com.trafico.simulator.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de estado de un vehículo individual para el broadcast de world-state.
 * Se envía en cada tick (cada 100ms) dentro del WorldStateDTO.
 * Contiene solo los datos necesarios para renderizar el vehículo en el canvas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {

    /** Identificador único del vehículo (formato "V-007"). */
    private String id;

    /** Columna actual en el grid. */
    private int col;

    /** Fila actual en el grid. */
    private int row;

    /** Columna de la posición anterior (para renderizar trail y calcular dirección visual). */
    private int prevCol;

    /** Fila de la posición anterior. */
    private int prevRow;

    /** Dirección actual: NORTH, SOUTH, EAST, WEST. */
    private String direction;

    /** Estado actual: CALCULATING, MOVING, WAITING, COMPLETED, NO_ROUTE. */
    private String state;

    /** Índice de color en la paleta vehicleColors (0-9). */
    private int colorIndex;

    /** Indica si este vehículo es el líder (menor tiempo de viaje completado). */
    private boolean isLeader;

    /** Tiempo de viaje acumulado en milisegundos desde el inicio. */
    private long travelTimeMs;

    /** Tiempo de espera acumulado en semáforos, en milisegundos. */
    private long waitTimeMs;
}
