/** Tests para el servicio REST hacia el backend. */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiService } from './api.service'
import type { SimulationConfig } from '../types/config.types'

const sampleConfig: SimulationConfig = {
  gridSize: 12,
  vehicleCount: 50,
  executionMode: 'PARALLEL',
  trafficLight: { greenDurationMs: 5000, yellowDurationMs: 2000, redDurationMs: 6000 },
  originMode: 'RANDOM',
  destinationMode: 'RANDOM',
  simulationSpeed: 1.0,
  smartTrafficLights: false,
}

function mockFetch(payload: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  } as Response)
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

describe('apiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('startSimulation hace POST a /api/simulation/start con el config como body', async () => {
    const fn = mockFetch({ simulationId: 'SIM-1', status: 'LOADING', gridSize: 12, vehicleCount: 50, trafficLightCount: 16, estimatedLoadTimeMs: 800 })
    const res = await apiService.startSimulation(sampleConfig)

    expect(fn).toHaveBeenCalledOnce()
    const [url, init] = fn.mock.calls[0]
    expect(url).toBe('/api/simulation/start')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init?.body as string)).toEqual(sampleConfig)
    expect(res.simulationId).toBe('SIM-1')
  })

  it('pauseSimulation hace POST a /api/simulation/pause', async () => {
    const fn = mockFetch({})
    await apiService.pauseSimulation()
    expect(fn.mock.calls[0][0]).toBe('/api/simulation/pause')
    expect(fn.mock.calls[0][1]?.method).toBe('POST')
  })

  it('resumeSimulation hace POST a /api/simulation/resume', async () => {
    const fn = mockFetch({})
    await apiService.resumeSimulation()
    expect(fn.mock.calls[0][0]).toBe('/api/simulation/resume')
  })

  it('stopSimulation hace POST a /api/simulation/stop y devuelve los resultados', async () => {
    const stopPayload = { simulationId: 'SIM-1', summary: { firstVehicleId: 'V-001' } }
    mockFetch(stopPayload)
    const res = await apiService.stopSimulation()
    expect(res.simulationId).toBe('SIM-1')
  })

  it('getStatus hace GET a /api/simulation/status', async () => {
    const fn = mockFetch({ status: 'RUNNING' })
    await apiService.getStatus()
    expect(fn.mock.calls[0][0]).toBe('/api/simulation/status')
    expect(fn.mock.calls[0][1]).toBeUndefined()
  })

  it('getMaxVehicles agrega el query param gridSize', async () => {
    const fn = mockFetch({ gridSize: 12, maxVehicles: 57 })
    await apiService.getMaxVehicles(12)
    expect(fn.mock.calls[0][0]).toBe('/api/configuration/max-vehicles?gridSize=12')
  })

  it('lanza error con código HTTP cuando la respuesta no es ok', async () => {
    mockFetch({}, false, 500)
    await expect(apiService.pauseSimulation()).rejects.toThrow(/Error HTTP 500/)
  })
})
