/** Sección de configuración del grid de la ciudad. */

import Card from '../../components/ui/Card'
import Slider from '../../components/ui/Slider'
import { useConfigStore } from '../../store/config.store'
import { SIMULATION_LIMITS } from '../../constants/simulation.constants'

export default function CitySection() {
  const { config, setConfig } = useConfigStore()

  return (
    <Card>
      <h2 className="text-text-primary font-semibold mb-4">🗺️ Ciudad</h2>
      <Slider
        label="Tamaño del grid"
        min={SIMULATION_LIMITS.GRID_MIN}
        max={SIMULATION_LIMITS.GRID_MAX}
        step={2}
        value={config.gridSize}
        onChange={(v) => setConfig({ gridSize: v })}
        formatValue={(v) => `${v}×${v}`}
      />
    </Card>
  )
}
