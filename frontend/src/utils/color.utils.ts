/** Utilidades de color para el renderizado del canvas. */

import { COLORS } from '../constants/colors'

/** Obtiene el color de un vehículo por su índice en la paleta */
export function getVehicleColor(colorIndex: number): string {
  return COLORS.vehicleColors[colorIndex % COLORS.vehicleColors.length]
}

/** Obtiene el color de un semáforo según su estado */
export function getTrafficLightColor(state: 'GREEN' | 'YELLOW' | 'RED'): string {
  const map = {
    GREEN: COLORS.trafficGreen,
    YELLOW: COLORS.trafficYellow,
    RED: COLORS.trafficRed,
  }
  return map[state]
}

/** Convierte hex a rgb para aplicar transparencias */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
