/** Tests para las utilidades de color del canvas. */

import { describe, it, expect } from 'vitest'
import { getVehicleColor, getTrafficLightColor, hexToRgba } from './color.utils'
import { COLORS } from '../constants/colors'

describe('getVehicleColor', () => {
  it('retorna el color del índice exacto', () => {
    expect(getVehicleColor(0)).toBe(COLORS.vehicleColors[0])
    expect(getVehicleColor(9)).toBe(COLORS.vehicleColors[9])
  })

  it('wraps el índice con módulo cuando excede la paleta', () => {
    expect(getVehicleColor(10)).toBe(COLORS.vehicleColors[0])
    expect(getVehicleColor(11)).toBe(COLORS.vehicleColors[1])
  })
})

describe('getTrafficLightColor', () => {
  it('retorna verde para GREEN', () => {
    expect(getTrafficLightColor('GREEN')).toBe(COLORS.trafficGreen)
  })

  it('retorna amarillo para YELLOW', () => {
    expect(getTrafficLightColor('YELLOW')).toBe(COLORS.trafficYellow)
  })

  it('retorna rojo para RED', () => {
    expect(getTrafficLightColor('RED')).toBe(COLORS.trafficRed)
  })
})

describe('hexToRgba', () => {
  it('convierte #58a6ff con alpha 1 a rgba completo', () => {
    expect(hexToRgba('#58a6ff', 1)).toBe('rgba(88, 166, 255, 1)')
  })

  it('convierte #3fb950 con alpha 0.5', () => {
    expect(hexToRgba('#3fb950', 0.5)).toBe('rgba(63, 185, 80, 0.5)')
  })

  it('convierte #f85149 con alpha 0.15', () => {
    expect(hexToRgba('#f85149', 0.15)).toBe('rgba(248, 81, 73, 0.15)')
  })
})
