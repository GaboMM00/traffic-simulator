/** Tests para el hook useSimulation — verifica las transiciones de appState y llamadas al apiService. */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../services/api.service', () => ({
  apiService: {
    startSimulation: vi.fn(),
    pauseSimulation: vi.fn(),
    resumeSimulation: vi.fn(),
    stopSimulation: vi.fn(),
  },
}))

import { useSimulation } from './useSimulation'
import { useSimulationStore } from '../store/simulation.store'
import { apiService } from '../services/api.service'

describe('useSimulation', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      appState: 'CONFIGURING',
      simulationId: null,
      worldState: null,
      liveMetrics: null,
      events: [],
      results: null,
    })
    vi.clearAllMocks()
  })

  it('startSimulation pasa LOADING → RUNNING en éxito y guarda simulationId', async () => {
    vi.mocked(apiService.startSimulation).mockResolvedValue({
      simulationId: 'SIM-42',
      status: 'LOADING',
      gridSize: 12,
      vehicleCount: 50,
      trafficLightCount: 16,
      estimatedLoadTimeMs: 800,
    })

    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.startSimulation()
    })

    expect(useSimulationStore.getState().appState).toBe('RUNNING')
    expect(useSimulationStore.getState().simulationId).toBe('SIM-42')
  })

  it('startSimulation regresa a CONFIGURING si la API falla', async () => {
    vi.mocked(apiService.startSimulation).mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.startSimulation()
    })

    expect(useSimulationStore.getState().appState).toBe('CONFIGURING')
    expect(useSimulationStore.getState().simulationId).toBeNull()
  })

  it('pauseSimulation cambia appState a PAUSED y llama a la API', async () => {
    vi.mocked(apiService.pauseSimulation).mockResolvedValue(undefined)
    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.pauseSimulation()
    })

    expect(apiService.pauseSimulation).toHaveBeenCalledOnce()
    expect(useSimulationStore.getState().appState).toBe('PAUSED')
  })

  it('resumeSimulation cambia appState a RUNNING y llama a la API', async () => {
    vi.mocked(apiService.resumeSimulation).mockResolvedValue(undefined)
    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.resumeSimulation()
    })

    expect(apiService.resumeSimulation).toHaveBeenCalledOnce()
    expect(useSimulationStore.getState().appState).toBe('RUNNING')
  })

  it('stopSimulation pasa por FINISHING y termina en RESULTS guardando resultados', async () => {
    const fakeResults = {
      simulationId: 'SIM-1',
      completedAt: '2026-05-03T00:00:00',
      totalDurationMs: 45200,
      executionMode: 'PARALLEL' as const,
      routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 89 },
      vehicles: [],
      summary: {
        firstVehicleId: 'V-001',
        firstVehicleTravelTimeMs: 12400,
        averageTravelTimeMs: 18700,
        averageWaitTimeMs: 4100,
        averageWaitTimePercent: 21.9,
        totalCompleted: 50,
        totalVehicles: 50,
        mostCongestedIntersectionId: 'I-4-6',
        mostCongestedIntersectionWaits: 23,
      },
    }
    vi.mocked(apiService.stopSimulation).mockResolvedValue(fakeResults)

    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.stopSimulation()
    })

    expect(useSimulationStore.getState().appState).toBe('RESULTS')
    expect(useSimulationStore.getState().results).toEqual(fakeResults)
  })

  it('stopSimulation termina en RESULTS aunque la API falle', async () => {
    vi.mocked(apiService.stopSimulation).mockRejectedValue(new Error('network'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useSimulation())
    await act(async () => {
      await result.current.stopSimulation()
    })

    expect(useSimulationStore.getState().appState).toBe('RESULTS')
  })
})
