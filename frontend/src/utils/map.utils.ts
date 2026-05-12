/** Utilidades de transformación de coordenadas para el canvas Konva. */

/**
 * Convierte una posición de grid (col, row) a píxeles en el canvas.
 * El punto retornado es el centro de la celda.
 */
export function gridToPixel(col: number, row: number, cellSize: number): { x: number; y: number } {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  }
}

/** Interpolación lineal entre dos valores (para el modo follow) */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Calcula el ángulo de rotación en grados para la dirección dada */
export function directionToAngle(direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'): number {
  const angles = { NORTH: -90, SOUTH: 90, EAST: 0, WEST: 180 }
  return angles[direction]
}
