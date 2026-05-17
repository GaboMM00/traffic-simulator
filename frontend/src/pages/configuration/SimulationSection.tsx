/** Sección de configuración de velocidad, duración de semáforos y modo de semáforos. */

import Card from '../../components/ui/Card'
import Slider from '../../components/ui/Slider'
import { useConfigStore } from '../../store/config.store'
import { SIMULATION_LIMITS } from '../../constants/simulation.constants'

export default function SimulationSection() {
  const { config, setConfig } = useConfigStore()
  const { trafficLight, smartTrafficLights, simulationSpeed } = config

  const greenS  = trafficLight.greenDurationMs  / 1000
  const yellowS = trafficLight.yellowDurationMs / 1000
  const redS    = trafficLight.redDurationMs    / 1000
  const totalS  = greenS + yellowS + redS

  const lightsDisabled = smartTrafficLights

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
        value={simulationSpeed * 10}
        onChange={(v) => setConfig({ simulationSpeed: v / 10 })}
        formatValue={(v) => `${(v / 10).toFixed(1)}x`}
      />

      {/* ── Duración de semáforos ─────────────────────────────── */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Duración de semáforos</span>
          {lightsDisabled && (
            <span className="text-xs text-text-secondary italic">ajuste automático</span>
          )}
        </div>

        <div className={lightsDisabled ? 'opacity-40 pointer-events-none select-none' : ''}>
          <Slider
            label="🟢 Verde"
            min={SIMULATION_LIMITS.GREEN_MIN_S}
            max={SIMULATION_LIMITS.GREEN_MAX_S}
            step={1}
            value={greenS}
            onChange={(v) =>
              setConfig({ trafficLight: { ...trafficLight, greenDurationMs: v * 1000 } })
            }
            formatValue={(v) => `${v}s`}
            disabled={lightsDisabled}
          />
          <div className="mt-2">
            <Slider
              label="🟡 Amarillo"
              min={SIMULATION_LIMITS.YELLOW_MIN_S}
              max={SIMULATION_LIMITS.YELLOW_MAX_S}
              step={1}
              value={yellowS}
              onChange={(v) =>
                setConfig({ trafficLight: { ...trafficLight, yellowDurationMs: v * 1000 } })
              }
              formatValue={(v) => `${v}s`}
              disabled={lightsDisabled}
            />
          </div>
          <div className="mt-2">
            <Slider
              label="🔴 Rojo"
              min={SIMULATION_LIMITS.RED_MIN_S}
              max={SIMULATION_LIMITS.RED_MAX_S}
              step={1}
              value={redS}
              onChange={(v) =>
                setConfig({ trafficLight: { ...trafficLight, redDurationMs: v * 1000 } })
              }
              formatValue={(v) => `${v}s`}
              disabled={lightsDisabled}
            />
          </div>
        </div>

        {/* Preview en tiempo real del ciclo */}
        <div className="mt-3 p-2 rounded-lg bg-surface-hover border border-border text-xs text-center text-text-secondary">
          {lightsDisabled
            ? 'Los semáforos inteligentes ajustan los tiempos automáticamente'
            : `Ciclo total: ${totalS}s — Verde ${greenS}s → Amarillo ${yellowS}s → Rojo ${redS}s`}
        </div>
      </div>

      {/* ── Semáforos inteligentes ────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Semáforos inteligentes</span>
        <button
          onClick={() => setConfig({ smartTrafficLights: !smartTrafficLights })}
          className={`w-10 h-5 rounded-full transition-colors ${
            smartTrafficLights ? 'bg-accent' : 'bg-border'
          }`}
          aria-checked={smartTrafficLights}
          role="switch"
        />
      </div>
    </Card>
  )
}
