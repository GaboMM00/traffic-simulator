package com.trafico.simulator.domain.valueobject;

import lombok.Value;

/**
 * Coordenada inmutable que representa una posición en el grid de la ciudad.
 * El eje col crece hacia la derecha y row crece hacia abajo (origen en (0,0) arriba izquierda).
 */
@Value
public class Coordinate {

    /** Columna en el grid (eje horizontal, crece hacia la derecha). */
    int col;

    /** Fila en el grid (eje vertical, crece hacia abajo). */
    int row;

    /**
     * Genera el identificador de intersección en formato estándar del sistema.
     *
     * @return identificador con formato "I-{col}-{row}", por ejemplo "I-4-7"
     */
    public String toIntersectionId() {
        return "I-" + col + "-" + row;
    }

    /**
     * Verifica si esta coordenada está dentro de los límites del grid.
     *
     * @param gridSize tamaño del grid (cuadrado)
     * @return true si la coordenada es válida dentro del grid
     */
    public boolean isValid(int gridSize) {
        return col >= 0 && col < gridSize && row >= 0 && row < gridSize;
    }

    /**
     * Verifica si esta coordenada pertenece al borde del grid.
     * Los vehículos solo pueden originarse en nodos del borde.
     *
     * @param gridSize tamaño del grid (cuadrado)
     * @return true si la coordenada está en el borde
     */
    public boolean isBorder(int gridSize) {
        return col == 0 || col == gridSize - 1 || row == 0 || row == gridSize - 1;
    }
}
