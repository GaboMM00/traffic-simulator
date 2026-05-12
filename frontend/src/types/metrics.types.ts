/** Tipos de métricas para el panel lateral y la pantalla de resultados. */

export interface MetricsDTO {
  activeVehicles: number
  completedVehicles: number
  waitingVehicles: number
  mostCongestedIntersectionId: string
}

export interface WorldStateDTO {
  tick: number
  simulationTimeMs: number
  vehicles: import('./vehicle.types').VehicleDTO[]
  trafficLights: import('./traffic-light.types').TrafficLightDTO[]
  metrics: MetricsDTO
}

export interface SimulationEventDTO {
  type: SimulationEventType
  timestamp: number
  payload: Record<string, unknown>
}

/**
 * Snapshot enviado periódicamente por el canal /topic/metrics (~500ms).
 * Contiene la comparación seq vs paralelo con el speedup; útil para gráficos en vivo.
 */
export interface LiveMetricsDTO {
  activeVehicles: number
  completedVehicles: number
  waitingVehicles: number
  mostCongestedIntersectionId: string | null
  mostCongestedIntersectionWaits: number
  leadVehicleId: string | null
  leadVehicleTravelTimeMs: number
  averageTravelTimeMs: number
  sequentialRouteTimeMs: number
  parallelRouteTimeMs: number
  speedup: number | null
}

export type SimulationEventType =
  | 'VEHICLE_ARRIVED'
  | 'VEHICLE_WAITING'
  | 'HIGH_CONGESTION'
  | 'SIMULATION_FINISHED'
  | 'DEADLOCK_DETECTED'
  | 'TRAFFIC_LIGHT_EXTENDED'
  | 'ROUTE_CALCULATION_STARTED'
  | 'ROUTE_CALCULATION_FINISHED'
