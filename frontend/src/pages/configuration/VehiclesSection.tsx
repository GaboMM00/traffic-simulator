/** Sección de configuración de vehículos con badge de carga (modo AUTO). */

import Card from '../../components/ui/Card'
import SteppedSlider from '../../components/ui/SteppedSlider'
import Badge from '../../components/ui/Badge'
import { useConfigStore } from '../../store/config.store'
import { VEHICLE_STEPS, maxVehiclesForGrid } from '../../constants/simulation.constants'

function loadBadge(count: number, max: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  const ratio = count / max
  if (ratio < 0.4) return { label: '⚡ Ligero', variant: 'success' }
  if (ratio < 0.75) return { label: '⚠️ Moderado', variant: 'warning' }
  return { label: '🔥 Intenso', variant: 'danger' }
}

export default function VehiclesSection() {
  const { config, setConfig } = useConfigStore()
  const maxVehicles = maxVehiclesForGrid(config.gridSize)

  // Solo permitimos pasos ≤ máximo del grid actual
  const availableSteps = VEHICLE_STEPS.filter((v) => v <= maxVehicles)
  // Si el grid es pequeño y ningún paso encaja, al menos exponemos el mínimo
  const safeSteps = availableSteps.length > 0
    ? availableSteps
    : [Math.max(VEHICLE_STEPS[0], maxVehicles)]
  const effectiveCount = Math.min(config.vehicleCount, maxVehicles)
  const badge = loadBadge(effectiveCount, maxVehicles)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-semibold">🚗 Vehículos</h2>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <SteppedSlider
        label={`Número de vehículos (máx ${maxVehicles} para ${config.gridSize}×${config.gridSize})`}
        steps={safeSteps}
        value={effectiveCount}
        onChange={(v) => setConfig({ vehicleCount: v })}
      />
    </Card>
  )
}
