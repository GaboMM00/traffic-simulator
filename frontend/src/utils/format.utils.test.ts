/** Tests para las utilidades de formateo de la interfaz de usuario. */

import { describe, it, expect } from 'vitest'
import { formatDuration, formatSeconds, formatPercent, formatSpeedup, formatVehicleId } from './format.utils'

describe('formatDuration', () => {
  it('formatea 0ms como 00:00.00', () => {
    expect(formatDuration(0)).toBe('00:00.00')
  })

  it('formatea 1 minuto exacto como 01:00.00', () => {
    expect(formatDuration(60000)).toBe('01:00.00')
  })

  it('formatea 1min 30s 500ms correctamente', () => {
    expect(formatDuration(90500)).toBe('01:30.50')
  })

  it('formatea 45.2s (45200ms) correctamente', () => {
    expect(formatDuration(45200)).toBe('00:45.20')
  })
})

describe('formatSeconds', () => {
  it('formatea 12400ms como "12.4s"', () => {
    expect(formatSeconds(12400)).toBe('12.4s')
  })

  it('formatea 0ms como "0.0s"', () => {
    expect(formatSeconds(0)).toBe('0.0s')
  })

  it('formatea 1000ms como "1.0s"', () => {
    expect(formatSeconds(1000)).toBe('1.0s')
  })
})

describe('formatPercent', () => {
  it('formatea 21.9 como "21.9%"', () => {
    expect(formatPercent(21.9)).toBe('21.9%')
  })

  it('formatea 0 como "0.0%"', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('formatea 100 como "100.0%"', () => {
    expect(formatPercent(100)).toBe('100.0%')
  })
})

describe('formatSpeedup', () => {
  it('calcula y formatea speedup 3.82x', () => {
    expect(formatSpeedup(340, 89)).toBe('3.82x')
  })

  it('retorna N/A cuando paralelo es 0', () => {
    expect(formatSpeedup(400, 0)).toBe('N/A')
  })

  it('retorna 1.00x cuando seq == par', () => {
    expect(formatSpeedup(100, 100)).toBe('1.00x')
  })
})

describe('formatVehicleId', () => {
  it('retorna el ID sin transformar', () => {
    expect(formatVehicleId('V-007')).toBe('V-007')
    expect(formatVehicleId('V-001')).toBe('V-001')
  })
})
