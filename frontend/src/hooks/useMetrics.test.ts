/** Tests para el hook useMetrics — verifica la derivación desde el worldState. */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMetrics } from './useMetrics'
import { useSimulationStore } from '../store/simulation.store'
import type { WorldStateDTO } from '../types/metrics.types'

function makeWorldState(overrides: Partial<WorldStateDTO> = {}): WorldStateDTO {
  return {
    tick: 100,
    simulationTimeMs: 5000,
    vehicles: [],
    trafficLights: [],
    metrics: {
      activeVehicles: 0,
      completedVehicles: 0,
      waitingVehicles: 0,
      mostCongestedIntersectionId: '',
    },
    ...overrides,
  }
}

describe('useMetrics', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      appState: 'IDLE',
      simulationId: null,
      seqWorldState: null,
      parWorldState: null,
      events: [],
      results: null,
    })
  })

  it('devuelve valores por defecto cuando no hay worldState', () => {
    const { result } = renderHook(() => useMetrics())
    expect(result.current.simulationTimeMs).toBe(0)
    expect(result.current.activeCount).toBe(0)
    expect(result.current.completedCount).toBe(0)
    expect(result.current.waitingCount).toBe(0)
    expect(result.current.mostCongestedId).toBeNull()
    expect(result.current.leader).toBeNull()
    expect(result.current.vehicles).toEqual([])
    expect(result.current.trafficLights).toEqual([])
  })

  it('extrae los contadores de metrics del parWorldState por defecto', () => {
    useSimulationStore.setState({
      parWorldState: makeWorldState({
        metrics: {
          activeVehicles: 47,
          completedVehicles: 3,
          waitingVehicles: 12,
          mostCongestedIntersectionId: 'I-4-6',
        },
      }),
    })
    const { result } = renderHook(() => useMetrics())
    expect(result.current.activeCount).toBe(47)
    expect(result.current.completedCount).toBe(3)
    expect(result.current.waitingCount).toBe(12)
    expect(result.current.mostCongestedId).toBe('I-4-6')
  })

  it('identifica al vehículo líder (isLeader=true)', () => {
    useSimulationStore.setState({
      parWorldState: makeWorldState({
        vehicles: [
          { id: 'V-001', col: 0, row: 0, prevCol: 0, prevRow: 0, direction: 'EAST', state: 'MOVING', colorIndex: 0, isLeader: false, travelTimeMs: 100, waitTimeMs: 0 },
          { id: 'V-002', col: 1, row: 1, prevCol: 0, prevRow: 1, direction: 'EAST', state: 'MOVING', colorIndex: 1, isLeader: true, travelTimeMs: 50, waitTimeMs: 0 },
        ],
      }),
    })
    const { result } = renderHook(() => useMetrics())
    expect(result.current.leader?.id).toBe('V-002')
  })

  it('expone los vehículos y semáforos del worldState', () => {
    useSimulationStore.setState({
      parWorldState: makeWorldState({
        vehicles: [
          { id: 'V-001', col: 0, row: 0, prevCol: 0, prevRow: 0, direction: 'EAST', state: 'MOVING', colorIndex: 0, isLeader: false, travelTimeMs: 100, waitTimeMs: 0 },
        ],
        trafficLights: [
          { intersectionId: 'I-0-0', col: 0, row: 0, state: 'GREEN', remainingMs: 1000, queueSize: 2, isExtended: false },
        ],
      }),
    })
    const { result } = renderHook(() => useMetrics())
    expect(result.current.vehicles).toHaveLength(1)
    expect(result.current.trafficLights).toHaveLength(1)
  })

  it('expone los eventos en orden inverso (más recientes primero)', () => {
    useSimulationStore.setState({
      events: [
        { type: 'VEHICLE_ARRIVED', timestamp: 2, payload: {} },
        { type: 'HIGH_CONGESTION', timestamp: 1, payload: {} },
      ],
    })
    const { result } = renderHook(() => useMetrics())
    expect(result.current.events).toHaveLength(2)
    expect(result.current.events[0].timestamp).toBe(2)
  })

  it('usa el worldState provisto como parámetro en lugar del parWorldState del store', () => {
    useSimulationStore.setState({
      parWorldState: makeWorldState({
        metrics: { activeVehicles: 99, completedVehicles: 0, waitingVehicles: 0, mostCongestedIntersectionId: '' },
      }),
    })
    const customWs = makeWorldState({
      metrics: { activeVehicles: 5, completedVehicles: 0, waitingVehicles: 0, mostCongestedIntersectionId: '' },
    })
    const { result } = renderHook(() => useMetrics(customWs))
    expect(result.current.activeCount).toBe(5)
  })
})
