/** Tests para las utilidades de transformación de coordenadas del canvas. */

import { describe, it, expect } from 'vitest'
import { gridToPixel, lerp, directionToAngle } from './map.utils'

describe('gridToPixel', () => {
  it('retorna el centro de la celda (0,0) con cellSize=60', () => {
    const { x, y } = gridToPixel(0, 0, 60)
    expect(x).toBe(30)
    expect(y).toBe(30)
  })

  it('retorna el centro de la celda (4,7) con cellSize=60', () => {
    const { x, y } = gridToPixel(4, 7, 60)
    expect(x).toBe(4 * 60 + 30)
    expect(y).toBe(7 * 60 + 30)
  })

  it('retorna el centro de la celda (0,0) con cellSize=45', () => {
    const { x, y } = gridToPixel(0, 0, 45)
    expect(x).toBe(22.5)
    expect(y).toBe(22.5)
  })
})

describe('lerp', () => {
  it('retorna a cuando t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('retorna b cuando t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('retorna el punto medio cuando t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
  })
})

describe('directionToAngle', () => {
  it('EAST → 0 grados', () => {
    expect(directionToAngle('EAST')).toBe(0)
  })

  it('WEST → 180 grados', () => {
    expect(directionToAngle('WEST')).toBe(180)
  })

  it('NORTH → -90 grados', () => {
    expect(directionToAngle('NORTH')).toBe(-90)
  })

  it('SOUTH → 90 grados', () => {
    expect(directionToAngle('SOUTH')).toBe(90)
  })
})
