/** Barra superior de la pantalla de simulación con modo, cronómetro y controles. */

import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useSimulationStore } from '../../store/simulation.store'
import { useUiStore } from '../../store/ui.store'
import { formatDuration } from '../../utils/format.utils'
import { TOPBAR_HEIGHT } from '../../constants/map.constants'

export default function TopBar() {
  const appState     = useSimulationStore((s) => s.appState)
  const parWorldState = useSimulationStore((s) => s.parWorldState)
  const { toggleSidebar } = useUiStore()

  const time = parWorldState?.simulationTimeMs ?? 0

  return (
    <div
      style={{ height: TOPBAR_HEIGHT }}
      className="flex items-center justify-between px-4 border-b border-border bg-surface shrink-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-text-primary font-semibold text-sm">Simulador de Tráfico</span>
        <Badge variant="info">SEQ + PAR</Badge>
        {appState === 'PAUSED' && <Badge variant='warning'>Pausado</Badge>}
      </div>

      <span className="text-text-primary font-mono text-sm">{formatDuration(time)}</span>

      <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Alternar sidebar">
        ☰
      </Button>
    </div>
  )
}
