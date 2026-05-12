/** Constantes de configuración del simulador. */

export const SIMULATION_DEFAULTS = {
  GRID_SIZE: 12,
  VEHICLE_COUNT: 50,
  GREEN_DURATION_MS: 5000,
  YELLOW_DURATION_MS: 2000,
  RED_DURATION_MS: 6000,
  SIMULATION_SPEED: 1.0,
  SMART_TRAFFIC_LIGHTS: false,
} as const

export const SIMULATION_LIMITS = {
  GRID_MIN: 8,
  GRID_MAX: 20,
  VEHICLES_MIN: 20,
  VEHICLES_MAX: 200,
  SPEED_MIN: 0.5,
  SPEED_MAX: 3.0,
  GREEN_MIN_S: 1,
  GREEN_MAX_S: 15,
  YELLOW_MIN_S: 1,
  YELLOW_MAX_S: 5,
  RED_MIN_S: 1,
  RED_MAX_S: 15,
} as const

export const PRESETS = {
  DEMO: { gridSize: 12, vehicleCount: 30, simulationSpeed: 2.0 },
  STANDARD: { gridSize: 12, vehicleCount: 80, simulationSpeed: 1.0 },
  STRESS: { gridSize: 16, vehicleCount: 200, simulationSpeed: 1.0 },
} as const

/** Máximo de vehículos permitidos según el grid size */
export function maxVehiclesForGrid(gridSize: number): number {
  return Math.min(200, Math.floor(gridSize * gridSize * 0.4))
}

export const WS_TOPICS = {
  WORLD_STATE_SEQ: '/topic/world-state/seq',
  WORLD_STATE_PAR: '/topic/world-state/par',
  EVENTS: '/topic/events',
} as const

export const API_ENDPOINTS = {
  START: '/api/simulation/start',
  PAUSE: '/api/simulation/pause',
  RESUME: '/api/simulation/resume',
  STOP: '/api/simulation/stop',
  STATUS: '/api/simulation/status',
  MAX_VEHICLES: '/api/configuration/max-vehicles',
  DEFAULTS: '/api/configuration/defaults',
} as const
