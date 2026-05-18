/** Tipos del estado global y la máquina de estados de la aplicación. */

export type AppState =
  | 'IDLE'
  | 'CONFIGURING'
  | 'LOADING'
  | 'RUNNING'
  | 'PAUSED'
  | 'FINISHING'
  | 'RESULTS'

export type ExecutionMode = 'SEQUENTIAL' | 'PARALLEL'

export type OriginMode = 'RANDOM' | 'MANUAL'

export type DestinationMode = 'RANDOM' | 'MANUAL'

export interface SimulationStartResponse {
  simulationId: string
  status: string
  gridSize: number
  vehicleCount: number
  trafficLightCount: number
  estimatedLoadTimeMs: number
}

export interface SimulationStopResponse {
  simulationId: string
  completedAt: string
  totalDurationMs: number
  routeCalculation: RouteCalculation
  sequential: RunResult
  parallel: RunResult
}

export interface RouteCalculation {
  sequentialTimeMs: number
  parallelTimeMs: number
  /**
   * Tiempos en nanosegundos. En grids pequeños el cómputo A* es sub-milisegundo
   * (los *Ms serían 0). Los *Ns permiten formatear el resultado en µs en esos casos.
   * Pueden ser 0 (o ausentes) en respuestas legacy del backend.
   */
  sequentialTimeNs?: number
  parallelTimeNs?: number
  speedup: number | null
}

export interface RunResult {
  durationMs: number
  vehicles: VehicleResult[]
  summary: SimulationSummary
  /** Estadísticas de semáforos inteligentes; null si smartTrafficLights estaba desactivado. */
  smartLightStats: SmartLightStats | null
}

export interface SmartLightStats {
  totalGreenExtensions: number
  totalGreenReductions: number
  totalRedReductions: number
}

export interface VehicleResult {
  vehicleId: string
  arrivalOrder: number
  travelTimeMs: number
  waitTimeMs: number
  waitTimePercent: number
  routeLength: number
  completed: boolean
}

export interface SimulationSummary {
  firstVehicleId: string
  firstVehicleTravelTimeMs: number
  averageTravelTimeMs: number
  averageWaitTimeMs: number
  averageWaitTimePercent: number
  totalCompleted: number
  totalVehicles: number
  mostCongestedIntersectionId: string
  mostCongestedIntersectionWaits: number
}
