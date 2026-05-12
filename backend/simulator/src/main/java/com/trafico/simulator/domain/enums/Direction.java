package com.trafico.simulator.domain.enums;

/**
 * Direcciones cardinales de movimiento en el grid de la ciudad.
 * Determina hacia dónde se mueve un vehículo y cómo se renderiza visualmente.
 */
public enum Direction {

    /** Movimiento hacia arriba en el grid (row decrece). */
    NORTH,

    /** Movimiento hacia abajo en el grid (row aumenta). */
    SOUTH,

    /** Movimiento hacia la derecha en el grid (col aumenta). */
    EAST,

    /** Movimiento hacia la izquierda en el grid (col decrece). */
    WEST
}
