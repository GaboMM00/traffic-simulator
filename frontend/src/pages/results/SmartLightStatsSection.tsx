/** Sección de resultados con estadísticas de semáforos inteligentes. */

import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import type { SimulationStopResponse } from '../../types/simulation.types'

interface SmartLightStatsSectionProps {
  results: SimulationStopResponse
}

/**
 * Renderiza la sección de estadísticas de semáforos inteligentes solo si al menos
 * uno de los dos runners (SEQ o PAR) tuvo {@code smartLightStats}. Compara los
 * totales de extensiones y reducciones aplicadas en cada ejecución, y muestra el
 * impacto cualitativo en el tiempo promedio de espera.
 */
export default function SmartLightStatsSection({ results }: SmartLightStatsSectionProps) {
  const seqStats = results.sequential.smartLightStats
  const parStats = results.parallel.smartLightStats

  if (!seqStats && !parStats) return null

  // Stats activos. Si solo uno está presente, se usa para ambas columnas como referencia.
  const seq = seqStats ?? parStats!
  const par = parStats ?? seqStats!

  const seqWait = results.sequential.summary.averageWaitTimeMs
  const parWait = results.parallel.summary.averageWaitTimeMs
  const waitDiff = seqWait - parWait
  const waitDiffPct = seqWait > 0 ? (waitDiff / seqWait) * 100 : 0

  const rows = [
    {
      icon: '⏫',
      label: 'Extensiones de verde aplicadas',
      seq: seq.totalGreenExtensions,
      par: par.totalGreenExtensions,
      hint: 'Verdes alargados por cola persistente',
    },
    {
      icon: '⏬',
      label: 'Reducciones de verde aplicadas',
      seq: seq.totalGreenReductions,
      par: par.totalGreenReductions,
      hint: 'Verdes acortados porque la cola se vació',
    },
    {
      icon: '🔻',
      label: 'Reducciones de rojo aplicadas',
      seq: seq.totalRedReductions,
      par: par.totalRedReductions,
      hint: 'Rojos acortados por cola crítica (>8)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-text-primary font-semibold">Semáforos inteligentes</h3>
          </div>
          <span className="text-xs text-accent uppercase tracking-wide">activo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rows.map((row, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface-hover border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-text-secondary text-xs">{row.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-blue-400 font-semibold mb-0.5">SEQ</p>
                  <p className="font-bold text-text-primary">{row.seq}</p>
                </div>
                <div>
                  <p className="text-[10px] text-accent font-semibold mb-0.5">PAR</p>
                  <p className="font-bold text-text-primary">{row.par}</p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-2 leading-tight">{row.hint}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-surface-hover border border-border text-xs">
          <p className="text-text-secondary">
            <span className="text-text-primary font-medium">Impacto en espera promedio:</span>{' '}
            {Math.abs(waitDiff) < 1
              ? 'sin diferencia significativa entre ambos modos.'
              : waitDiff > 0
                ? (
                  <>
                    el modo PAR redujo la espera en{' '}
                    <span className="text-accent font-semibold">{Math.abs(waitDiffPct).toFixed(1)}%</span>{' '}
                    respecto a SEQ.
                  </>
                )
                : (
                  <>
                    el modo SEQ resultó {Math.abs(waitDiffPct).toFixed(1)}% más rápido en espera promedio.
                  </>
                )}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
