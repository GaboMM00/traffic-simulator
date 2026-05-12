/** Constantes de escalado y renderizado del canvas del mapa. */

/** Espacio reservado por la topbar en px */
export const TOPBAR_HEIGHT = 48

/** Espacio reservado por la bottombar en px */
export const BOTTOMBAR_HEIGHT = 56

/** Ancho del sidebar en px */
export const SIDEBAR_WIDTH = 320

/** Calcula el tamaño de celda en px para un grid y canvas dados */
export function cellSizeForGrid(gridSize: number, canvasWidth: number, canvasHeight: number): number {
  return Math.floor(Math.min(canvasWidth, canvasHeight) / gridSize)
}

/** Ancho del vehículo relativo a la celda */
export const VEHICLE_WIDTH_RATIO = 0.5

/** Alto del vehículo relativo a la celda */
export const VEHICLE_HEIGHT_RATIO = 0.3

/** Radio de borde del vehículo relativo a su ancho */
export const VEHICLE_BORDER_RADIUS_RATIO = 0.3

/** Radio del semáforo relativo a la celda */
export const TRAFFIC_LIGHT_RADIUS_RATIO = 0.15

/** Radio del glow del semáforo relativo a su radio */
export const TRAFFIC_LIGHT_GLOW_RATIO = 2.5

/** Factor de interpolación lineal para el modo follow (suavidad del pan) */
export const FOLLOW_LERP_FACTOR = 0.1

/** Duración del pan animado al activar follow en ms */
export const FOLLOW_PAN_DURATION_MS = 300

/** Duración de la animación de fadeout del vehículo al completar su viaje en ms */
export const VEHICLE_FADEOUT_DURATION_MS = 600

/** Número máximo de frames en el trail del vehículo */
export const VEHICLE_TRAIL_LENGTH = 3
