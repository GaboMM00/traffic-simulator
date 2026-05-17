/** Hook principal que expone las acciones de control de la simulación (start, pause, resume, stop). */

import { useSimulationStore } from '../store/simulation.store'
import { useConfigStore } from '../store/config.store'
import { apiService } from '../services/api.service'

/**
 * Conecta las acciones de la UI con el apiService y el store.
 * Toda la lógica de transición de estado pasa por aquí.
 * El catch en startSimulation regresa a CONFIGURING para que el usuario
 * pueda reintentar sin quedar atrapado en LOADING.
 */
export function useSimulation() {
  const { setAppState, setSimulationId, setResults } = useSimulationStore()
  const { config } = useConfigStore()

  async function startSimulation() {
    setAppState('LOADING')
    try {
      const response = await apiService.startSimulation(config)
      setSimulationId(response.simulationId)
      setAppState('RUNNING')
    } catch (err) {
      console.error('Error al iniciar simulación:', err)
      setAppState('CONFIGURING')
    }
  }

  async function pauseSimulation() {
    try {
      await apiService.pauseSimulation()
    } catch (err) {
      console.error('Error al pausar simulación:', err)
    }
    setAppState('PAUSED')
  }

  async function resumeSimulation() {
    try {
      await apiService.resumeSimulation()
    } catch (err) {
      console.error('Error al reanudar simulación:', err)
    }
    setAppState('RUNNING')
  }

  async function stopSimulation() {
    setAppState('FINISHING')
    try {
      const results = await apiService.stopSimulation()
      setResults(results)
    } catch (err) {
      console.error('Error al detener simulación:', err)
    }
    setAppState('RESULTS')
  }

  return { startSimulation, pauseSimulation, resumeSimulation, stopSimulation }
}
