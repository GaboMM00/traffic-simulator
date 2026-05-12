/** Store de Zustand para la configuración de la simulación. */

import { create } from 'zustand'
import type { SimulationConfig } from '../types/config.types'
import { SIMULATION_DEFAULTS } from '../constants/simulation.constants'

const defaultConfig: SimulationConfig = {
  gridSize: SIMULATION_DEFAULTS.GRID_SIZE,
  vehicleCount: SIMULATION_DEFAULTS.VEHICLE_COUNT,
  executionMode: 'PARALLEL',
  trafficLight: {
    greenDurationMs: SIMULATION_DEFAULTS.GREEN_DURATION_MS,
    yellowDurationMs: SIMULATION_DEFAULTS.YELLOW_DURATION_MS,
    redDurationMs: SIMULATION_DEFAULTS.RED_DURATION_MS,
  },
  originMode: 'RANDOM',
  destinationMode: 'RANDOM',
  simulationSpeed: SIMULATION_DEFAULTS.SIMULATION_SPEED,
  smartTrafficLights: SIMULATION_DEFAULTS.SMART_TRAFFIC_LIGHTS,
}

interface ConfigStore {
  config: SimulationConfig
  setConfig: (config: Partial<SimulationConfig>) => void
  resetConfig: () => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: defaultConfig,
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  resetConfig: () => set({ config: defaultConfig }),
}))
