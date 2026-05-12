/** Tarjetas de métricas comparativas — Secuencial vs Paralelo. */

import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import type { SimulationStopResponse } from '../../types/simulation.types'
import { formatSeconds, formatSpeedup } from '../../utils/format.utils'

interface MetricCardsProps {
  results: SimulationStopResponse
}

export default function MetricCards({ results }: MetricCardsProps) {
  const { sequential, parallel, routeCalculation } = results
  const seqS = sequential.summary
  const parS = parallel.summary

  const cards = [
    {
      icon: '⏱',
      label: 'Duración simulación',
      seq: formatSeconds(sequential.durationMs),
      par: formatSeconds(parallel.durationMs),
      parBetter: parallel.durationMs <= sequential.durationMs,
    },
    {
      icon: '🚗',
      label: 'Tiempo prom. de viaje',
      seq: formatSeconds(seqS.averageTravelTimeMs),
      par: formatSeconds(parS.averageTravelTimeMs),
      parBetter: parS.averageTravelTimeMs <= seqS.averageTravelTimeMs,
    },
    {
      icon: '⏳',
      label: 'Espera promedio',
      seq: formatSeconds(seqS.averageWaitTimeMs),
      par: formatSeconds(parS.averageWaitTimeMs),
      parBetter: parS.averageWaitTimeMs <= seqS.averageWaitTimeMs,
    },
    {
      icon: '✅',
      label: 'Vehículos completados',
      seq: `${seqS.totalCompleted}/${seqS.totalVehicles}`,
      par: `${parS.totalCompleted}/${parS.totalVehicles}`,
      parBetter: parS.totalCompleted >= seqS.totalCompleted,
    },
    {
      icon: '⚡',
      label: 'Speedup cálculo de rutas',
      seq: `${routeCalculation.sequentialTimeMs}ms`,
      par: `${routeCalculation.parallelTimeMs}ms`,
      extra: formatSpeedup(routeCalculation.sequentialTimeMs, routeCalculation.parallelTimeMs),
      parBetter: routeCalculation.parallelTimeMs < routeCalculation.sequentialTimeMs,
    },
    {
      icon: '🔴',
      label: 'Intersección más congestionada',
      seq: seqS.mostCongestedIntersectionId || '—',
      par: parS.mostCongestedIntersectionId || '—',
      parBetter: parS.mostCongestedIntersectionWaits <= seqS.mostCongestedIntersectionWaits,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-lg">{card.icon}</span>
              <span className="text-text-muted text-xs">{card.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-blue-400 font-semibold mb-0.5">SEQ</p>
                <p className={`font-bold ${card.parBetter ? 'text-text-secondary' : 'text-accent'}`}>{card.seq}</p>
              </div>
              <div>
                <p className="text-xs text-accent font-semibold mb-0.5">PAR</p>
                <p className={`font-bold ${card.parBetter ? 'text-accent' : 'text-text-secondary'}`}>{card.par}</p>
                {card.parBetter && <span className="text-accent text-xs">mejor</span>}
              </div>
            </div>
            {card.extra && (
              <p className="text-xs text-text-muted border-t border-border pt-1">
                Speedup: <span className="text-accent font-semibold">{card.extra}</span>
              </p>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
