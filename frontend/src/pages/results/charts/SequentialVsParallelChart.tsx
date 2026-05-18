/** Gráfica comparando duración real de simulación (SEQ vs PAR) más speedup de rutas A*. */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Card from '../../../components/ui/Card'
import { COLORS } from '../../../constants/colors'
import { formatSpeedup, formatSeconds, formatRouteSpeedup } from '../../../utils/format.utils'
import type { RunResult, RouteCalculation } from '../../../types/simulation.types'

interface SequentialVsParallelChartProps {
  sequential: RunResult
  parallel: RunResult
  routeCalculation: RouteCalculation
}

export default function SequentialVsParallelChart({
  sequential,
  parallel,
  routeCalculation,
}: SequentialVsParallelChartProps) {
  const simSpeedup    = formatSpeedup(sequential.durationMs, parallel.durationMs)
  // Speedup de rutas usa la unidad más precisa disponible (Ns si vienen del backend)
  const routeSpeedup  = formatRouteSpeedup(
    routeCalculation.sequentialTimeMs,
    routeCalculation.parallelTimeMs,
    routeCalculation.sequentialTimeNs,
    routeCalculation.parallelTimeNs,
  )
  const parFaster     = parallel.durationMs < sequential.durationMs
  const tooFast       = sequential.durationMs === 0 && parallel.durationMs === 0
  // Solo es "demasiado rápido para medir" si NI siquiera con nanos hay señal
  const routeTooFast  = routeCalculation.sequentialTimeMs === 0
                     && routeCalculation.parallelTimeMs   === 0
                     && (routeCalculation.sequentialTimeNs ?? 0) === 0
                     && (routeCalculation.parallelTimeNs   ?? 0) === 0

  const data = [
    { mode: 'Secuencial', ms: sequential.durationMs },
    { mode: 'Paralelo',   ms: parallel.durationMs },
  ]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">📊 Duración: Secuencial vs Paralelo</h3>
        <span className={`font-bold text-sm ${parFaster ? 'text-accent' : 'text-yellow-500'}`}>
          Speedup sim: {simSpeedup}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis dataKey="mode" tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
          <YAxis
            tick={{ fill: COLORS.textMuted, fontSize: 10 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}s`}
          />
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
            formatter={(v: number) => [formatSeconds(v), 'Duración']}
          />
          <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
            <Cell fill={COLORS.textSecondary} />
            <Cell fill={parFaster ? COLORS.accent : '#eab308'} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 text-xs text-center">
        <span className="text-text-muted">
          SEQ: <span className="text-text-secondary font-medium">{formatSeconds(sequential.durationMs)}</span>
        </span>
        <span className="text-text-muted">
          Rutas A*: <span className="text-accent font-medium">{routeTooFast ? 'sub-ms' : routeSpeedup}</span>
        </span>
        <span className="text-text-muted">
          PAR: <span className={`font-medium ${parFaster ? 'text-accent' : 'text-yellow-500'}`}>{formatSeconds(parallel.durationMs)}</span>
        </span>
      </div>

      {tooFast && (
        <p className="text-text-muted text-xs mt-2 leading-snug">
          ℹ Simulaciones sub-segundo — usa más vehículos o un grid mayor para ver diferencias.
        </p>
      )}
    </Card>
  )
}
