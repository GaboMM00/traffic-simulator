/** Tests para las constantes y utilidades de configuración del simulador. */

import { describe, it, expect } from 'vitest'
import {
  maxVehiclesForGrid,
  SIMULATION_DEFAULTS,
  SIMULATION_LIMITS,
  PRESETS,
} from './simulation.constants'

describe('maxVehiclesForGrid', () => {
  it('retorna 40 para gridSize=10 (10²×0.4=40)', () => {
    expect(maxVehiclesForGrid(10)).toBe(40)
  })

  it('retorna 57 para gridSize=12 (12²×0.4=57.6 → 57)', () => {
    expect(maxVehiclesForGrid(12)).toBe(57)
  })

  it('retorna 25 para gridSize=8 (8²×0.4=25.6 → 25)', () => {
    expect(maxVehiclesForGrid(8)).toBe(25)
  })

  it('retorna 160 para gridSize=20 (20²×0.4=160)', () => {
    expect(maxVehiclesForGrid(20)).toBe(160)
  })

  it('no excede 200 aunque el grid sea muy grande', () => {
    expect(maxVehiclesForGrid(30)).toBe(200)
  })
})

describe('SIMULATION_DEFAULTS', () => {
  it('tiene gridSize 12 por defecto', () => {
    expect(SIMULATION_DEFAULTS.GRID_SIZE).toBe(12)
  })

  it('tiene vehicleCount 50 por defecto', () => {
    expect(SIMULATION_DEFAULTS.VEHICLE_COUNT).toBe(50)
  })

  it('tiene simulationSpeed 1.0 por defecto', () => {
    expect(SIMULATION_DEFAULTS.SIMULATION_SPEED).toBe(1.0)
  })
})

describe('SIMULATION_LIMITS', () => {
  it('grid mínimo es 8 y máximo es 20', () => {
    expect(SIMULATION_LIMITS.GRID_MIN).toBe(8)
    expect(SIMULATION_LIMITS.GRID_MAX).toBe(20)
  })

  it('vehículos mínimo 20 y máximo 200', () => {
    expect(SIMULATION_LIMITS.VEHICLES_MIN).toBe(20)
    expect(SIMULATION_LIMITS.VEHICLES_MAX).toBe(200)
  })
})

describe('PRESETS', () => {
  it('STRESS usa gridSize=16 y vehicleCount=200', () => {
    expect(PRESETS.STRESS.gridSize).toBe(16)
    expect(PRESETS.STRESS.vehicleCount).toBe(200)
  })

  it('DEMO usa vehicleCount=30 y speed=2.0', () => {
    expect(PRESETS.DEMO.vehicleCount).toBe(30)
    expect(PRESETS.DEMO.simulationSpeed).toBe(2.0)
  })
})
