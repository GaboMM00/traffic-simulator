/** Botones de presets rápidos para la pantalla de configuración. */

import Button from '../../components/ui/Button'
import { useConfigStore } from '../../store/config.store'
import { PRESETS } from '../../constants/simulation.constants'

export default function PresetButtons() {
  const { setConfig } = useConfigStore()

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => setConfig(PRESETS.DEMO)}>
        Demo rápida
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setConfig(PRESETS.STANDARD)}>
        Estándar
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setConfig(PRESETS.STRESS_HIGH)}>
        Estrés alto
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setConfig(PRESETS.STRESS_EXTREME)}>
        🔥 Estrés extremo
      </Button>
    </div>
  )
}
