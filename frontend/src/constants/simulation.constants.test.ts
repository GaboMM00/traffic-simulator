/** Tests para las constantes y utilidades de configuración del simulador. */

import { describe, it, expect } from 'vitest'
import {
  maxVehiclesForGrid,
  cellSizeForGrid,
  nearestStepIndex,
  SIMULATION_DEFAULTS,
  SIMULATION_LIMITS,
  PRESETS,
  GRID_STEPS,
  VEHICLE_STEPS,
  HIGH_LOAD_THRESHOLDS,
} from './simulation.constants'

describe('maxVehiclesForGrid', () => {
  it('retorna 20 para gridSize=10 (10²×0.2=20)', () => {
    expect(maxVehiclesForGrid(10)).toBe(20)
  })

  it('retorna 28 para gridSize=12 (12²×0.2=28.8 → 28)', () => {
    expect(maxVehiclesForGrid(12)).toBe(28)
  })

  it('retorna 12 para gridSize=8 (8²×0.2=12.8 → 12)', () => {
    expect(maxVehiclesForGrid(8)).toBe(12)
  })

  it('retorna 80 para gridSize=20 (20²×0.2=80)', () => {
    expect(maxVehiclesForGrid(20)).toBe(80)
  })

  it('retorna 500 para gridSize=50 (50²×0.2=500)', () => {
    expect(maxVehiclesForGrid(50)).toBe(500)
  })

  it('alcanza el tope absoluto 2000 en gridSize=100', () => {
    expect(maxVehiclesForGrid(100)).toBe(2000)
  })

  it('no excede 2000 aunque el grid sea mayor a 100', () => {
    expect(maxVehiclesForGrid(150)).toBe(2000)
  })
})

describe('cellSizeForGrid', () => {
  it('mantiene cellSize ≥ 6 incluso en grids extremos', () => {
    expect(cellSizeForGrid(100)).toBeGreaterThanOrEqual(6)
    expect(cellSizeForGrid(200)).toBe(6)
  })

  it('escala proporcionalmente para grids medianos', () => {
    expect(cellSizeForGrid(20)).toBe(36) // floor(720/20)
    expect(cellSizeForGrid(40)).toBe(18) // floor(720/40)
  })
})

describe('nearestStepIndex', () => {
  it('encuentra el índice exacto cuando el valor coincide', () => {
    expect(nearestStepIndex(20, GRID_STEPS)).toBe(GRID_STEPS.indexOf(20))
  })

  it('redondea al paso más cercano', () => {
    // entre 25 y 30 → 25 si está más cerca
    expect(GRID_STEPS[nearestStepIndex(27, GRID_STEPS)]).toBe(25)
    expect(GRID_STEPS[nearestStepIndex(28, GRID_STEPS)]).toBe(30)
  })

  it('mapea valores extremos al primer/último paso', () => {
    expect(nearestStepIndex(1, GRID_STEPS)).toBe(0)
    expect(nearestStepIndex(9999, GRID_STEPS)).toBe(GRID_STEPS.length - 1)
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
  it('grid mínimo es 8 y máximo es 100 (nuevo techo extremo)', () => {
    expect(SIMULATION_LIMITS.GRID_MIN).toBe(8)
    expect(SIMULATION_LIMITS.GRID_MAX).toBe(100)
  })

  it('vehículos mínimo 20 y máximo 2000 (nuevo techo extremo)', () => {
    expect(SIMULATION_LIMITS.VEHICLES_MIN).toBe(20)
    expect(SIMULATION_LIMITS.VEHICLES_MAX).toBe(2000)
  })
})

describe('PRESETS', () => {
  it('DEMO usa vehicleCount=30 y speed=2.0', () => {
    expect(PRESETS.DEMO.vehicleCount).toBe(30)
    expect(PRESETS.DEMO.simulationSpeed).toBe(2.0)
  })

  it('STANDARD usa gridSize=20 y vehicleCount=150', () => {
    expect(PRESETS.STANDARD.gridSize).toBe(20)
    expect(PRESETS.STANDARD.vehicleCount).toBe(150)
  })

  it('STRESS_HIGH usa gridSize=50 y vehicleCount=500', () => {
    expect(PRESETS.STRESS_HIGH.gridSize).toBe(50)
    expect(PRESETS.STRESS_HIGH.vehicleCount).toBe(500)
  })

  it('STRESS_EXTREME usa gridSize=100 y vehicleCount=2000', () => {
    expect(PRESETS.STRESS_EXTREME.gridSize).toBe(100)
    expect(PRESETS.STRESS_EXTREME.vehicleCount).toBe(2000)
  })
})

describe('GRID_STEPS y VEHICLE_STEPS', () => {
  it('GRID_STEPS arranca en 8 y termina en 100', () => {
    expect(GRID_STEPS[0]).toBe(8)
    expect(GRID_STEPS[GRID_STEPS.length - 1]).toBe(100)
  })

  it('VEHICLE_STEPS arranca en 20 y termina en 2000', () => {
    expect(VEHICLE_STEPS[0]).toBe(20)
    expect(VEHICLE_STEPS[VEHICLE_STEPS.length - 1]).toBe(2000)
  })

  it('pasos son monótonamente crecientes', () => {
    for (let i = 1; i < GRID_STEPS.length; i++) {
      expect(GRID_STEPS[i]).toBeGreaterThan(GRID_STEPS[i - 1])
    }
    for (let i = 1; i < VEHICLE_STEPS.length; i++) {
      expect(VEHICLE_STEPS[i]).toBeGreaterThan(VEHICLE_STEPS[i - 1])
    }
  })
})

describe('HIGH_LOAD_THRESHOLDS', () => {
  it('define umbrales para mostrar advertencia de carga extrema', () => {
    expect(HIGH_LOAD_THRESHOLDS.VEHICLE_COUNT).toBe(1000)
    expect(HIGH_LOAD_THRESHOLDS.GRID_SIZE).toBe(60)
  })
})
