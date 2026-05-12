/** Hook que deriva métricas del world-state del runner PAR para el panel lateral. */

import { useSimulationStore } from '../store/simulation.store'
import type { WorldStateDTO } from '../types/metrics.types'

/**
 * Extrae métricas del worldState provisto (o del runner PAR por defecto).
 * El panel lateral muestra las métricas del runner PARALLEL; cada CityMap
 * recibe su worldState directamente como prop.
 */
export function useMetrics(worldState?: WorldStateDTO | null) {
  const parWorldState = useSimulationStore((s) => s.parWorldState)
  const events        = useSimulationStore((s) => s.events)

  const ws      = worldState !== undefined ? worldState : parWorldState
  const metrics = ws?.metrics ?? null
  const vehicles     = ws?.vehicles ?? []
  const trafficLights = ws?.trafficLights ?? []
  const simulationTimeMs = ws?.simulationTimeMs ?? 0

  const leader        = vehicles.find((v) => v.isLeader) ?? null
  const activeCount   = metrics?.activeVehicles ?? 0
  const completedCount = metrics?.completedVehicles ?? 0
  const waitingCount  = metrics?.waitingVehicles ?? 0
  const mostCongestedId = metrics?.mostCongestedIntersectionId ?? null

  return {
    simulationTimeMs,
    activeCount,
    completedCount,
    waitingCount,
    mostCongestedId,
    leader,
    vehicles,
    trafficLights,
    events,
  }
}
