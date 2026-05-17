/** Feed de eventos discretos de la simulación. Muestra hasta 20 eventos, los más nuevos arriba. */

import { useSimulationStore } from '../../store/simulation.store'
import type { SimulationEventDTO, SimulationEventType } from '../../types/metrics.types'

const EVENT_ICONS: Record<SimulationEventType, string> = {
  VEHICLE_ARRIVED: '🏁',
  VEHICLE_WAITING: '🚦',
  HIGH_CONGESTION: '🔴',
  SIMULATION_FINISHED: '✅',
  DEADLOCK_DETECTED: '⚠️',
  TRAFFIC_LIGHT_EXTENDED: '⚡',
  TRAFFIC_LIGHT_REDUCED: '⚡',
  ROUTE_CALCULATION_STARTED: '🔄',
  ROUTE_CALCULATION_FINISHED: '📊',
}

const EVENT_LABELS: Record<SimulationEventType, string> = {
  VEHICLE_ARRIVED: 'Vehículo llegó',
  VEHICLE_WAITING: 'Vehículo esperando',
  HIGH_CONGESTION: 'Alta congestión',
  SIMULATION_FINISHED: 'Simulación terminada',
  DEADLOCK_DETECTED: 'Deadlock detectado',
  TRAFFIC_LIGHT_EXTENDED: 'Semáforo extendido',
  TRAFFIC_LIGHT_REDUCED: 'Semáforo reducido',
  ROUTE_CALCULATION_STARTED: 'Calculando rutas',
  ROUTE_CALCULATION_FINISHED: 'Rutas calculadas',
}

function EventDetail({ event }: { event: SimulationEventDTO }) {
  if (event.type === 'ROUTE_CALCULATION_STARTED') {
    const mode = event.payload['mode'] as string | undefined
    const label = mode === 'SEQUENTIAL' ? 'SECUENCIAL' : mode === 'PARALLEL' ? 'PARALELO' : mode ?? ''
    return <span className="text-text-muted ml-1">— modo {label}</span>
  }

  if (event.type === 'TRAFFIC_LIGHT_EXTENDED') {
    const id    = event.payload['intersectionId'] as string | undefined
    const queue = event.payload['queueSize']      as number | undefined
    return (
      <span className="text-text-muted ml-1">
        — {id} extendió verde 2s (cola: {queue ?? '?'} vehículos)
      </span>
    )
  }

  if (event.type === 'TRAFFIC_LIGHT_REDUCED') {
    const id    = event.payload['intersectionId'] as string | undefined
    const phase = event.payload['phase']          as string | undefined
    const queue = event.payload['queueSize']      as number | undefined
    if (phase === 'GREEN') {
      return (
        <span className="text-text-muted ml-1">
          — {id} acortó verde (cola vaciada)
        </span>
      )
    }
    return (
      <span className="text-text-muted ml-1">
        — {id} redujo rojo 1s (cola crítica: {queue ?? '?'} vehículos)
      </span>
    )
  }

  if (event.type === 'ROUTE_CALCULATION_FINISHED') {
    const seq     = event.payload['sequentialMs'] as number | undefined
    const par     = event.payload['parallelMs']   as number | undefined
    const speedup = event.payload['speedup']       as number | undefined
    if (seq !== undefined && par !== undefined && speedup !== undefined) {
      const overheadDominates  = speedup < 1.0
      const tooFastToMeasure   = seq === 0 && par === 0
      return (
        <span className="ml-1 flex flex-col gap-0.5">
          <span className="text-text-muted">
            — Sec: {seq}ms | Par: {par}ms | Speedup:{' '}
            <span className={overheadDominates ? 'text-yellow-500' : 'text-green-400'}>
              {speedup.toFixed(2)}x
            </span>
          </span>
          {tooFastToMeasure && (
            <span className="text-text-muted text-[10px] leading-tight">
              ℹ cómputo sub-milisegundo — usa grid ≥ 16 para speedup visible
            </span>
          )}
          {!tooFastToMeasure && overheadDominates && (
            <span className="text-yellow-600 text-[10px] leading-tight">
              ⚠ overhead ForkJoinPool &gt; beneficio para este tamaño de grid
            </span>
          )}
        </span>
      )
    }
  }

  return null
}

export default function EventFeed() {
  const events = useSimulationStore((s) => s.events)

  return (
    <div>
      <h4 className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wide">Eventos</h4>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {events.length === 0 && (
          <p className="text-text-muted text-xs">Sin eventos aún...</p>
        )}
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0">
            <span className="shrink-0">{EVENT_ICONS[event.type]}</span>
            <span className="text-text-secondary flex-1 flex flex-wrap items-center">
              {EVENT_LABELS[event.type]}
              <EventDetail event={event} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
