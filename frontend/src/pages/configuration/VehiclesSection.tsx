/** Sección de configuración de vehículos con badge de carga. */

import Card from '../../components/ui/Card'
import Slider from '../../components/ui/Slider'
import Badge from '../../components/ui/Badge'
import { useConfigStore } from '../../store/config.store'
import { SIMULATION_LIMITS, maxVehiclesForGrid } from '../../constants/simulation.constants'

function loadBadge(count: number, max: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  const ratio = count / max
  if (ratio < 0.4) return { label: '⚡ Ligero', variant: 'success' }
  if (ratio < 0.75) return { label: '⚠️ Moderado', variant: 'warning' }
  return { label: '🔥 Intenso', variant: 'danger' }
}

export default function VehiclesSection() {
  const { config, setConfig } = useConfigStore()
  const maxVehicles = maxVehiclesForGrid(config.gridSize)
  const badge = loadBadge(config.vehicleCount, maxVehicles)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-semibold">🚗 Vehículos</h2>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <Slider
        label="Número de vehículos"
        min={SIMULATION_LIMITS.VEHICLES_MIN}
        max={maxVehicles}
        value={Math.min(config.vehicleCount, maxVehicles)}
        onChange={(v) => setConfig({ vehicleCount: v })}
      />
    </Card>
  )
}
