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
  GRID_MAX: 100,
  VEHICLES_MIN: 20,
  VEHICLES_MAX: 2000,
  SPEED_MIN: 0.5,
  SPEED_MAX: 3.0,
  GREEN_MIN_S: 1,
  GREEN_MAX_S: 15,
  YELLOW_MIN_S: 1,
  YELLOW_MAX_S: 5,
  RED_MIN_S: 1,
  RED_MAX_S: 15,
} as const

/**
 * Pasos discretos para el slider de tamaño de grid.
 * Concentra precisión en grids pequeños (8-20) y permite saltar a valores extremos
 * (50-100) sin que el slider se vuelva impráctico.
 */
export const GRID_STEPS = [8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100] as const

/**
 * Pasos discretos para el slider de cantidad de vehículos en modo AUTO.
 * Cubre desde simulaciones ligeras (20-100) hasta escenarios de estrés extremo (2000).
 */
export const VEHICLE_STEPS = [20, 30, 50, 80, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000] as const

/**
 * Umbrales para advertencia de alta carga al iniciar la simulación.
 * Cuando se superan, se muestra un diálogo de confirmación antes de POST /start.
 */
export const HIGH_LOAD_THRESHOLDS = {
  VEHICLE_COUNT: 1000,
  GRID_SIZE: 60,
} as const

/**
 * Umbral a partir del cual la representación gráfica se simplifica
 * (semáforos como píxeles, vehículos como rect mínimo, sin labels).
 * Por debajo se mantiene el render rico con glow y círculos.
 */
export const SIMPLIFIED_RENDER_THRESHOLD_GRID = 40
/** A partir de este grid: auto fit-to-screen al iniciar y labels desactivados por defecto. */
export const AUTO_FIT_GRID_THRESHOLD = 60

export const PRESETS = {
  DEMO:           { gridSize: 12,  vehicleCount: 30,   simulationSpeed: 2.0 },
  STANDARD:       { gridSize: 20,  vehicleCount: 150,  simulationSpeed: 1.0 },
  STRESS_HIGH:    { gridSize: 50,  vehicleCount: 500,  simulationSpeed: 1.0 },
  STRESS_EXTREME: { gridSize: 100, vehicleCount: 2000, simulationSpeed: 1.0 },
} as const

/**
 * Máximo de vehículos permitidos según el grid size.
 * Fórmula: min(2000, gridSize² × 0.2). Coincide con el backend.
 */
export function maxVehiclesForGrid(gridSize: number): number {
  return Math.min(2000, Math.floor(gridSize * gridSize * 0.2))
}

/**
 * Calcula el cellSize en píxeles para un grid dado, asumiendo un canvas de ~720px.
 * Garantiza un mínimo de 6px para que grids 100×100 sigan siendo visibles.
 */
export function cellSizeForGrid(gridSize: number, canvasSize = 720): number {
  return Math.max(6, Math.floor(canvasSize / gridSize))
}

/**
 * Mapea un valor real al índice más cercano en un arreglo de pasos discretos.
 * Útil para inicializar SteppedSlider con un valor "libre" (e.g. al cargar config).
 */
export function nearestStepIndex(value: number, steps: readonly number[]): number {
  let bestIdx = 0
  let bestDist = Math.abs(steps[0] - value)
  for (let i = 1; i < steps.length; i++) {
    const d = Math.abs(steps[i] - value)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
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
