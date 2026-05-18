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

  if (event.type === 'VEHICLE_WAITING') {
    const id       = event.payload['vehicleId']      as string | undefined
    const col      = event.payload['col']            as number | undefined
    const row      = event.payload['row']            as number | undefined
    const waitMs   = event.payload['waitMs']         as number | undefined
    const blocking = event.payload['blocking']       as string | undefined
    const lightId  = event.payload['intersectionId'] as string | undefined
    const where    = blocking
      ? `bloqueado en ${blocking}`
      : lightId
        ? `en semáforo ${lightId}`
        : ''
    const coords = col !== undefined && row !== undefined ? ` @ (${col},${row})` : ''
    return (
      <span className="text-text-muted ml-1">
        — {id ?? '?'}{coords}{where ? ` — ${where}` : ''}
        {waitMs ? ` (${(waitMs / 1000).toFixed(1)}s)` : ''}
      </span>
    )
  }

  if (event.type === 'HIGH_CONGESTION') {
    const lightId = event.payload['intersectionId'] as string | undefined
    const queue   = event.payload['queueSize']      as number | undefined
    const id      = event.payload['vehicleId']      as string | undefined
    const col     = event.payload['col']            as number | undefined
    const row     = event.payload['row']            as number | undefined
    const coords  = col !== undefined && row !== undefined ? ` @ (${col},${row})` : ''
    return (
      <span className="text-text-muted ml-1">
        — {lightId ?? '?'} (cola: {queue ?? '?'}){id ? ` — disparado por ${id}${coords}` : ''}
      </span>
    )
  }

  if (event.type === 'DEADLOCK_DETECTED') {
    const victim    = event.payload['victimVehicleId'] as string | undefined
    const victimCol = event.payload['victimCol']       as number | undefined
    const victimRow = event.payload['victimRow']       as number | undefined
    const cycle     = event.payload['cycleVehicles']   as string[] | undefined
    const positions = event.payload['cyclePositions']  as
      | Record<string, { col: number; row: number }>
      | undefined

    const victimCoords =
      victimCol !== undefined && victimRow !== undefined ? ` @ (${victimCol},${victimRow})` : ''

    const cycleStr = cycle?.map((id) => {
      const p = positions?.[id]
      return p ? `${id}(${p.col},${p.row})` : id
    }).join(' → ')

    return (
      <span className="text-text-muted ml-1 flex flex-col gap-0.5">
        <span>— víctima: {victim ?? '?'}{victimCoords}</span>
        {cycleStr && <span className="text-[10px]">ciclo: {cycleStr}</span>}
      </span>
    )
  }

  if (event.type === 'VEHICLE_ARRIVED') {
    const id    = event.payload['vehicleId']    as string | undefined
    const order = event.payload['arrivalOrder'] as number | undefined
    const ms    = event.payload['travelTimeMs'] as number | undefined
    return (
      <span className="text-text-muted ml-1">
        — {id ?? '?'}{order ? ` (orden #${order}` : ''}{ms ? `, ${(ms / 1000).toFixed(1)}s)` : order ? ')' : ''}
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
    const seqMs   = event.payload['sequentialMs'] as number | undefined
    const parMs   = event.payload['parallelMs']   as number | undefined
    const seqNs   = event.payload['sequentialNs'] as number | undefined
    const parNs   = event.payload['parallelNs']   as number | undefined
    const speedup = event.payload['speedup']      as number | undefined
    if (seqMs !== undefined && parMs !== undefined && speedup !== undefined) {
      const overheadDominates = speedup < 1.0
      // Solo es "imposible de medir" si NI siquiera con nanos hay señal
      const tooFastToMeasure  = seqMs === 0 && parMs === 0
                             && (seqNs ?? 0) === 0 && (parNs ?? 0) === 0
      // Formato adaptativo: ms si ≥1, sino µs (con 1 decimal)
      const fmt = (ms: number, ns?: number) => {
        if (ms >= 1) return `${ms}ms`
        if (ns && ns > 0) {
          const us = ns / 1_000
          return us >= 100 ? `${us.toFixed(0)}µs` : `${us.toFixed(1)}µs`
        }
        return `${ms}ms`
      }
      return (
        <span className="ml-1 flex flex-col gap-0.5">
          <span className="text-text-muted">
            — Sec: {fmt(seqMs, seqNs)} | Par: {fmt(parMs, parNs)} | Speedup:{' '}
            <span className={overheadDominates ? 'text-yellow-500' : 'text-green-400'}>
              {speedup.toFixed(2)}x
            </span>
          </span>
          {tooFastToMeasure && (
            <span className="text-text-muted text-[10px] leading-tight">
              ℹ cómputo sub-microsegundo — usa grid mayor para speedup visible
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
