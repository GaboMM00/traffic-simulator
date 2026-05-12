/** Sección de configuración de velocidad y semáforos de la simulación. */

import Card from '../../components/ui/Card'
import Slider from '../../components/ui/Slider'
import { useConfigStore } from '../../store/config.store'
import { SIMULATION_LIMITS } from '../../constants/simulation.constants'

export default function SimulationSection() {
  const { config, setConfig } = useConfigStore()

  return (
    <Card>
      <h2 className="text-text-primary font-semibold mb-4">⚙️ Simulación</h2>

      <div className="mb-4 p-3 rounded-lg bg-surface-hover border border-border text-xs text-text-secondary leading-relaxed">
        La simulación ejecuta <span className="text-accent font-semibold">ambos modos</span> simultáneamente:
        {' '}<span className="text-blue-400 font-semibold">Secuencial</span> y{' '}
        <span className="text-accent font-semibold">Paralelo</span>, con los mismos vehículos para una comparación justa.
      </div>

      <Slider
        label="Velocidad de simulación"
        min={SIMULATION_LIMITS.SPEED_MIN * 10}
        max={SIMULATION_LIMITS.SPEED_MAX * 10}
        step={1}
        value={config.simulationSpeed * 10}
        onChange={(v) => setConfig({ simulationSpeed: v / 10 })}
        formatValue={(v) => `${(v / 10).toFixed(1)}x`}
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Semáforos inteligentes</span>
        <button
          onClick={() => setConfig({ smartTrafficLights: !config.smartTrafficLights })}
          className={`w-10 h-5 rounded-full transition-colors ${
            config.smartTrafficLights ? 'bg-accent' : 'bg-border'
          }`}
          aria-checked={config.smartTrafficLights}
          role="switch"
        />
      </div>
    </Card>
  )
}
