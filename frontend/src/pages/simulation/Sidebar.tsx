/** Panel lateral de la simulación con métricas en tiempo real y lista de vehículos. */

import Badge from '../../components/ui/Badge'
import EventFeed from './EventFeed'
import { useMetrics } from '../../hooks/useMetrics'
import { formatDuration } from '../../utils/format.utils'

export default function Sidebar() {
  const { simulationTimeMs, activeCount, completedCount, waitingCount, mostCongestedId, leader } = useMetrics()

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-surface p-4 gap-4">
      <h3 className="text-text-primary font-semibold text-sm">Métricas en tiempo real</h3>

      <div className="grid grid-cols-2 gap-3">
        <MetricTile label="Activos" value={activeCount} />
        <MetricTile label="Completados" value={completedCount} />
        <MetricTile label="Esperando" value={waitingCount} />
        <MetricTile label="Tiempo" value={formatDuration(simulationTimeMs)} />
      </div>

      {mostCongestedId && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Más congestionada</span>
          <Badge variant="danger">{mostCongestedId}</Badge>
        </div>
      )}

      {leader && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Líder</span>
          <Badge variant="gold">🥇 {leader.id}</Badge>
        </div>
      )}

      <div className="mt-auto">
        <EventFeed />
      </div>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background rounded-lg p-3">
      <div className="text-text-muted text-xs mb-1">{label}</div>
      <div className="text-text-primary font-mono text-lg font-semibold">{value}</div>
    </div>
  )
}
