/** Sección de configuración del grid de la ciudad. */

import Card from '../../components/ui/Card'
import SteppedSlider from '../../components/ui/SteppedSlider'
import { useConfigStore } from '../../store/config.store'
import { GRID_STEPS } from '../../constants/simulation.constants'

export default function CitySection() {
  const { config, setConfig } = useConfigStore()

  return (
    <Card>
      <h2 className="text-text-primary font-semibold mb-4">🗺️ Ciudad</h2>
      <SteppedSlider
        label="Tamaño del grid"
        steps={GRID_STEPS}
        value={config.gridSize}
        onChange={(v) => setConfig({ gridSize: v })}
        formatValue={(v) => `${v}×${v}`}
      />
    </Card>
  )
}
