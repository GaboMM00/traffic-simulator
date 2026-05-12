/** Tests para el store de simulación dual (estado en ejecución, eventos). */

import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './simulation.store'
import type { SimulationEventDTO } from '../types/metrics.types'

function getStore() {
  return useSimulationStore.getState()
}

function makeEvent(i: number): SimulationEventDTO {
  return { type: 'VEHICLE_ARRIVED', timestamp: i, payload: { vehicleId: `V-${i}` } }
}

describe('simulation.store', () => {
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

  it('estado inicial es IDLE con todo en null', () => {
    const s = getStore()
    expect(s.appState).toBe('IDLE')
    expect(s.simulationId).toBeNull()
    expect(s.seqWorldState).toBeNull()
    expect(s.parWorldState).toBeNull()
    expect(s.events).toHaveLength(0)
    expect(s.results).toBeNull()
  })

  it('setAppState cambia el estado de la app', () => {
    getStore().setAppState('RUNNING')
    expect(getStore().appState).toBe('RUNNING')
  })

  it('setSimulationId almacena el id de simulación', () => {
    getStore().setSimulationId('sim-abc-123')
    expect(getStore().simulationId).toBe('sim-abc-123')
  })

  it('addEvent agrega un evento al inicio de la lista', () => {
    const e1 = makeEvent(1)
    const e2 = makeEvent(2)
    getStore().addEvent(e1)
    getStore().addEvent(e2)

    const { events } = getStore()
    expect(events[0]).toEqual(e2)
    expect(events[1]).toEqual(e1)
  })

  it('addEvent no acumula más de 30 eventos', () => {
    for (let i = 0; i < 35; i++) {
      getStore().addEvent(makeEvent(i))
    }
    expect(getStore().events).toHaveLength(30)
  })

  it('addEvent retiene los 30 más recientes', () => {
    for (let i = 0; i < 35; i++) {
      getStore().addEvent(makeEvent(i))
    }
    expect(getStore().events[0].timestamp).toBe(34)
    expect(getStore().events[29].timestamp).toBe(5)
  })

  it('reset limpia simulationId, worldStates, events y results', () => {
    getStore().setSimulationId('sim-xyz')
    getStore().addEvent(makeEvent(0))
    getStore().setAppState('RUNNING')

    getStore().reset()

    const s = getStore()
    expect(s.simulationId).toBeNull()
    expect(s.seqWorldState).toBeNull()
    expect(s.parWorldState).toBeNull()
    expect(s.events).toHaveLength(0)
    expect(s.results).toBeNull()
  })

  it('reset no modifica appState', () => {
    getStore().setAppState('RESULTS')
    getStore().reset()
    expect(getStore().appState).toBe('RESULTS')
  })
})
