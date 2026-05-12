/** Hook que gestiona la conexión WebSocket y actualiza los stores con los datos recibidos. */

import { useEffect, useRef } from 'react'
import { websocketService } from '../services/websocket.service'
import { useSimulationStore } from '../store/simulation.store'
import { useUiStore } from '../store/ui.store'

/**
 * Se monta una sola vez al iniciar la simulación.
 * Escucha los canales SEQ y PAR, y transiciona a FINISHING solo cuando
 * AMBOS runners publican SIMULATION_FINISHED.
 */
export function useWebSocket() {
  const setSeqWorldState = useSimulationStore((s) => s.setSeqWorldState)
  const setParWorldState = useSimulationStore((s) => s.setParWorldState)
  const addEvent         = useSimulationStore((s) => s.addEvent)
  const setAppState      = useSimulationStore((s) => s.setAppState)
  const setConnectionError = useUiStore((s) => s.setConnectionError)

  // Contador de SIMULATION_FINISHED: necesitamos 2 (uno por runner) antes de transicionar
  const finishedCount = useRef(0)

  useEffect(() => {
    finishedCount.current = 0
    websocketService.connect()

    const unsubSeq = websocketService.onSeqWorldState(setSeqWorldState)
    const unsubPar = websocketService.onParWorldState(setParWorldState)

    const unsubEv = websocketService.onEvent((event) => {
      addEvent(event)
      if (event.type === 'SIMULATION_FINISHED') {
        finishedCount.current += 1
        if (finishedCount.current >= 2) {
          setAppState('FINISHING')
        }
      }
    })

    const unsubSt = websocketService.onStatus((connected) => setConnectionError(!connected))

    return () => {
      unsubSeq()
      unsubPar()
      unsubEv()
      unsubSt()
      websocketService.disconnect()
    }
  }, [setSeqWorldState, setParWorldState, addEvent, setAppState, setConnectionError])
}
