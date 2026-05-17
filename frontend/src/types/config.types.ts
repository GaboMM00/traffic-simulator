/** Tipos para la configuración de la simulación. */

import type { ExecutionMode, OriginMode, DestinationMode } from './simulation.types'

/**
 * Modo de configuración de vehículos:
 *   - AUTO:   el sistema genera orígenes/destinos aleatorios según vehicleCount
 *   - MANUAL: el usuario define cada vehículo con clics en el mapa interactivo
 */
export type VehicleMode = 'AUTO' | 'MANUAL'

/**
 * Vehículo definido manualmente por el usuario en la pantalla de configuración.
 * Se envía al backend como {@code ManualVehiclePair} dentro de {@code manualVehicles}.
 */
export interface ManualVehicle {
  id: string
  originCol: number
  originRow: number
  destCol: number
  destRow: number
}

export interface SimulationConfig {
  gridSize: number
  vehicleCount: number
  executionMode: ExecutionMode
  trafficLight: TrafficLightConfig
  originMode: OriginMode
  destinationMode: DestinationMode
  simulationSpeed: number
  smartTrafficLights: boolean
  /** Modo de generación de vehículos: AUTO (aleatorio) o MANUAL (clics en mapa). */
  vehicleMode: VehicleMode
  /** Lista de vehículos definidos manualmente; vacía en modo AUTO. */
  manualVehicles: ManualVehicle[]
}

export interface TrafficLightConfig {
  greenDurationMs: number
  yellowDurationMs: number
  redDurationMs: number
}

export type ConfigValidationErrors = Partial<Record<keyof SimulationConfig, string>>
