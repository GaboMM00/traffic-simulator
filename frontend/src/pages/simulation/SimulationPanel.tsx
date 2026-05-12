/** Panel individual que muestra una simulación (SEQ o PAR) con su CityMap y stats básicas. */

import CityMap from '../../components/map/CityMap'
import { formatDuration } from '../../utils/format.utils'
import type { WorldStateDTO } from '../../types/metrics.types'

const PANEL_HEADER_PX = 36

interface SimulationPanelProps {
  mode: 'SEQUENTIAL' | 'PARALLEL'
  worldState: WorldStateDTO | null
  gridSize: number
  width: number
  height: number
}

export default function SimulationPanel({
  mode,
  worldState,
  gridSize,
  width,
  height,
}: SimulationPanelProps) {
  const label     = mode === 'SEQUENTIAL' ? 'Secuencial' : 'Paralelo'
  const completed = worldState?.metrics?.completedVehicles ?? 0
  const active    = worldState?.metrics?.activeVehicles ?? 0
  const timeMs    = worldState?.simulationTimeMs ?? 0
  const mapHeight = height - PANEL_HEADER_PX

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-3 shrink-0 border-b border-border bg-surface"
        style={{ height: PANEL_HEADER_PX }}
      >
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            mode === 'SEQUENTIAL' ? 'text-blue-400' : 'text-accent'
          }`}
        >
          {label}
        </span>
        <div className="flex gap-4 text-xs text-text-muted">
          <span>✅ {completed}</span>
          <span>🚗 {active}</span>
          <span>⏱ {formatDuration(timeMs)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CityMap
          gridSize={gridSize}
          width={width}
          height={mapHeight}
          worldState={worldState}
        />
      </div>
    </div>
  )
}
