/**
 * Pantalla principal de simulación (estado RUNNING/PAUSED/FINISHING).
 * Muestra DOS paneles lado a lado: SEQUENTIAL (izquierda) y PARALLEL (derecha).
 * Transiciona a resultados cuando AMBOS runners han publicado SIMULATION_FINISHED.
 */

import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import BottomBar from './BottomBar'
import Sidebar from './Sidebar'
import CompletionModal from '../results/CompletionModal'
import SimulationPanel from './SimulationPanel'
import ConnectionErrorBanner from '../../components/ui/ConnectionErrorBanner'
import { useConfigStore } from '../../store/config.store'
import { useUiStore } from '../../store/ui.store'
import { useSimulationStore } from '../../store/simulation.store'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useSimulation } from '../../hooks/useSimulation'
import { TOPBAR_HEIGHT, BOTTOMBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants/map.constants'

export default function SimulationPage() {
  useWebSocket()

  const { config }          = useConfigStore()
  const { sidebarCollapsed } = useUiStore()
  const appState            = useSimulationStore((s) => s.appState)
  const seqWorldState       = useSimulationStore((s) => s.seqWorldState)
  const parWorldState       = useSimulationStore((s) => s.parWorldState)
  const { stopSimulation }  = useSimulation()

  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (appState === 'FINISHING') setShowModal(true)
  }, [appState])

  const sidebarW   = sidebarCollapsed ? 0 : SIDEBAR_WIDTH
  const totalMapW  = window.innerWidth - sidebarW
  const panelW     = Math.floor(totalMapW / 2)
  const mapH       = window.innerHeight - TOPBAR_HEIGHT - BOTTOMBAR_HEIGHT

  function handleViewResults() {
    setShowModal(false)
    stopSimulation()
  }

  function handleReviewMap() {
    setShowModal(false)
  }

  return (
    <div className="w-screen h-screen bg-background flex flex-col overflow-hidden">
      <ConnectionErrorBanner />
      <TopBar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Panel SEQ */}
        <div style={{ width: panelW, height: mapH }} className="border-r border-border">
          <SimulationPanel
            mode="SEQUENTIAL"
            worldState={seqWorldState}
            gridSize={config.gridSize}
            width={panelW}
            height={mapH}
          />
        </div>

        {/* Panel PAR */}
        <div style={{ width: panelW, height: mapH }}>
          <SimulationPanel
            mode="PARALLEL"
            worldState={parWorldState}
            gridSize={config.gridSize}
            width={panelW}
            height={mapH}
          />
        </div>

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div style={{ width: SIDEBAR_WIDTH }} className="border-l border-border flex flex-col overflow-hidden">
            <Sidebar />
          </div>
        )}

        {showModal && (
          <CompletionModal onViewResults={handleViewResults} onReviewMap={handleReviewMap} />
        )}
      </div>

      <BottomBar />
    </div>
  )
}
