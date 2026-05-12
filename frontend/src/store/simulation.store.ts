/** Store de Zustand para el estado de la simulación en ejecución (world-state, eventos, métricas). */

import { create } from 'zustand'
import type { AppState, SimulationStopResponse } from '../types/simulation.types'
import type { WorldStateDTO, SimulationEventDTO } from '../types/metrics.types'

interface SimulationStore {
  appState: AppState
  simulationId: string | null
  seqWorldState: WorldStateDTO | null
  parWorldState: WorldStateDTO | null
  events: SimulationEventDTO[]
  results: SimulationStopResponse | null

  setAppState: (state: AppState) => void
  setSimulationId: (id: string) => void
  setSeqWorldState: (ws: WorldStateDTO) => void
  setParWorldState: (ws: WorldStateDTO) => void
  addEvent: (event: SimulationEventDTO) => void
  setResults: (results: SimulationStopResponse) => void
  reset: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  appState: 'IDLE',
  simulationId: null,
  seqWorldState: null,
  parWorldState: null,
  events: [],
  results: null,

  setAppState: (appState) => set({ appState }),
  setSimulationId: (simulationId) => set({ simulationId }),
  setSeqWorldState: (seqWorldState) => set({ seqWorldState }),
  setParWorldState: (parWorldState) => set({ parWorldState }),
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 30),
    })),
  setResults: (results) => set({ results }),
  reset: () =>
    set({
      simulationId: null,
      seqWorldState: null,
      parWorldState: null,
      events: [],
      results: null,
    }),
}))
