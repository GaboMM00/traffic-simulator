/** Tipos para la configuración de la simulación. */

import type { ExecutionMode, OriginMode, DestinationMode } from './simulation.types'

export interface SimulationConfig {
  gridSize: number
  vehicleCount: number
  executionMode: ExecutionMode
  trafficLight: TrafficLightConfig
  originMode: OriginMode
  destinationMode: DestinationMode
  simulationSpeed: number
  smartTrafficLights: boolean
}

export interface TrafficLightConfig {
  greenDurationMs: number
  yellowDurationMs: number
  redDurationMs: number
}

export type ConfigValidationErrors = Partial<Record<keyof SimulationConfig, string>>
