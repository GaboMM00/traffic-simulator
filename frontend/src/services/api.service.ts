/** Servicio para las llamadas HTTP REST al backend. Centraliza fetch y manejo de errores. */

import type { SimulationConfig } from '../types/config.types'
import type { SimulationStartResponse, SimulationStopResponse } from '../types/simulation.types'
import { API_ENDPOINTS } from '../constants/simulation.constants'

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${url}`)
  }
  return response.json()
}

// Para endpoints que retornan cuerpo vacío o cuyo valor de retorno no importa.
// Usar en lugar de post<void> para evitar SyntaxError al parsear body vacío.
async function postVoid(url: string): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${url}`)
  }
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${url}`)
  }
  return response.json()
}

export const apiService = {
  startSimulation: (config: SimulationConfig) =>
    post<SimulationStartResponse>(API_ENDPOINTS.START, config),

  pauseSimulation: () =>
    postVoid(API_ENDPOINTS.PAUSE),

  resumeSimulation: () =>
    postVoid(API_ENDPOINTS.RESUME),

  stopSimulation: () =>
    post<SimulationStopResponse>(API_ENDPOINTS.STOP),

  getStatus: () =>
    get<{ status: string }>(API_ENDPOINTS.STATUS),

  getMaxVehicles: (gridSize: number) =>
    get<{ gridSize: number; maxVehicles: number }>(`${API_ENDPOINTS.MAX_VEHICLES}?gridSize=${gridSize}`),
}
