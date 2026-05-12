/** Tests para useWebSocket — verifica conexión, registro de handlers y limpieza. */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { fakeService, unsubFns } = vi.hoisted(() => {
  const unsubFns = {
    seq: vi.fn(),
    par: vi.fn(),
    ev: vi.fn(),
    st: vi.fn(),
  }
  const fakeService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onSeqWorldState: vi.fn(() => unsubFns.seq),
    onParWorldState: vi.fn(() => unsubFns.par),
    onEvent: vi.fn(() => unsubFns.ev),
    onStatus: vi.fn(() => unsubFns.st),
  }
  return { fakeService, unsubFns }
})

vi.mock('../services/websocket.service', () => ({
  websocketService: fakeService,
}))

import { useWebSocket } from './useWebSocket'
import { useSimulationStore } from '../store/simulation.store'
import { useUiStore } from '../store/ui.store'

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSimulationStore.setState({
      appState: 'IDLE',
      simulationId: null,
      seqWorldState: null,
      parWorldState: null,
      events: [],
      results: null,
    })
    useUiStore.setState({
      sidebarCollapsed: false,
      showVehicleLabels: true,
      followVehicleId: null,
      selectedVehicleId: null,
      isFullscreen: false,
      connectionError: false,
    })
  })

  it('al montar conecta el servicio y registra los 4 handlers', () => {
    renderHook(() => useWebSocket())
    expect(fakeService.connect).toHaveBeenCalledOnce()
    expect(fakeService.onSeqWorldState).toHaveBeenCalledOnce()
    expect(fakeService.onParWorldState).toHaveBeenCalledOnce()
    expect(fakeService.onEvent).toHaveBeenCalledOnce()
    expect(fakeService.onStatus).toHaveBeenCalledOnce()
  })

  it('al desmontar desuscribe los 4 handlers y desconecta', () => {
    const { unmount } = renderHook(() => useWebSocket())
    unmount()
    expect(unsubFns.seq).toHaveBeenCalledOnce()
    expect(unsubFns.par).toHaveBeenCalledOnce()
    expect(unsubFns.ev).toHaveBeenCalledOnce()
    expect(unsubFns.st).toHaveBeenCalledOnce()
    expect(fakeService.disconnect).toHaveBeenCalledOnce()
  })

  it('el handler de seqWorldState pasa los datos al store', () => {
    renderHook(() => useWebSocket())
    const handler = fakeService.onSeqWorldState.mock.calls[0][0] as (ws: unknown) => void

    act(() => {
      handler({
        tick: 5,
        simulationTimeMs: 1000,
        vehicles: [],
        trafficLights: [],
        metrics: { activeVehicles: 1, completedVehicles: 0, waitingVehicles: 0, mostCongestedIntersectionId: '' },
      })
    })

    expect(useSimulationStore.getState().seqWorldState?.tick).toBe(5)
  })

  it('el handler de parWorldState pasa los datos al store', () => {
    renderHook(() => useWebSocket())
    const handler = fakeService.onParWorldState.mock.calls[0][0] as (ws: unknown) => void

    act(() => {
      handler({
        tick: 7,
        simulationTimeMs: 2000,
        vehicles: [],
        trafficLights: [],
        metrics: { activeVehicles: 2, completedVehicles: 1, waitingVehicles: 0, mostCongestedIntersectionId: '' },
      })
    })

    expect(useSimulationStore.getState().parWorldState?.tick).toBe(7)
  })

  it('el handler de status pone connectionError=true cuando connected=false', () => {
    renderHook(() => useWebSocket())
    const handler = fakeService.onStatus.mock.calls[0][0] as (c: boolean) => void

    act(() => handler(false))
    expect(useUiStore.getState().connectionError).toBe(true)

    act(() => handler(true))
    expect(useUiStore.getState().connectionError).toBe(false)
  })

  it('el handler de events agrega al feed', () => {
    renderHook(() => useWebSocket())
    const handler = fakeService.onEvent.mock.calls[0][0] as (e: unknown) => void

    act(() => {
      handler({ type: 'VEHICLE_ARRIVED', timestamp: 1, payload: { vehicleId: 'V-001' } })
    })

    expect(useSimulationStore.getState().events).toHaveLength(1)
  })

  it('SIMULATION_FINISHED transiciona a FINISHING solo cuando llegan 2 eventos (uno por runner)', () => {
    useSimulationStore.setState({ appState: 'RUNNING' })
    renderHook(() => useWebSocket())
    const handler = fakeService.onEvent.mock.calls[0][0] as (e: unknown) => void

    act(() => {
      handler({ type: 'SIMULATION_FINISHED', timestamp: 21000, payload: {} })
    })
    expect(useSimulationStore.getState().appState).toBe('RUNNING')

    act(() => {
      handler({ type: 'SIMULATION_FINISHED', timestamp: 21500, payload: {} })
    })
    expect(useSimulationStore.getState().appState).toBe('FINISHING')
  })

  it('SIMULATION_FINISHED agrega el evento al feed', () => {
    useSimulationStore.setState({ appState: 'RUNNING' })
    renderHook(() => useWebSocket())
    const handler = fakeService.onEvent.mock.calls[0][0] as (e: unknown) => void

    act(() => {
      handler({ type: 'SIMULATION_FINISHED', timestamp: 21000, payload: {} })
    })

    expect(useSimulationStore.getState().events).toHaveLength(1)
  })
})
