/** Barra inferior con slider de velocidad, pausar/reanudar y reiniciar. */

import Slider from '../../components/ui/Slider'
import Button from '../../components/ui/Button'
import { useSimulationStore } from '../../store/simulation.store'
import { useSimulation } from '../../hooks/useSimulation'
import { useConfigStore } from '../../store/config.store'
import { SIMULATION_LIMITS } from '../../constants/simulation.constants'
import { BOTTOMBAR_HEIGHT } from '../../constants/map.constants'

export default function BottomBar() {
  const appState = useSimulationStore((s) => s.appState)
  const { config, setConfig } = useConfigStore()
  const { pauseSimulation, resumeSimulation } = useSimulation()

  const isPaused = appState === 'PAUSED'

  return (
    <div
      style={{ height: BOTTOMBAR_HEIGHT }}
      className="flex items-center justify-between px-4 border-t border-border bg-surface shrink-0 gap-4"
    >
      <div className="flex-1 max-w-xs">
        <Slider
          label=""
          min={SIMULATION_LIMITS.SPEED_MIN * 10}
          max={SIMULATION_LIMITS.SPEED_MAX * 10}
          step={1}
          value={config.simulationSpeed * 10}
          onChange={(v) => setConfig({ simulationSpeed: v / 10 })}
          formatValue={(v) => `${(v / 10).toFixed(1)}x`}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={isPaused ? resumeSimulation : pauseSimulation}
          aria-label={isPaused ? 'Reanudar simulación' : 'Pausar simulación'}
        >
          {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
        </Button>
      </div>
    </div>
  )
}
