/** Dos pie charts comparativos: tiempo en movimiento vs espera en SEQ y PAR. */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'
import type { SimulationSummary } from '../../../types/simulation.types'
import { COLORS } from '../../../constants/colors'

interface WaitTimePieChartProps {
  seqSummary: SimulationSummary
  parSummary: SimulationSummary
}

function makePieData(summary: SimulationSummary) {
  const waitPct = parseFloat(summary.averageWaitTimePercent.toFixed(1))
  const movePct = parseFloat((100 - waitPct).toFixed(1))
  return [
    { name: 'En movimiento', value: movePct },
    { name: 'Esperando',     value: waitPct },
  ]
}

function MiniPie({ summary, label, color }: { summary: SimulationSummary; label: string; color: string }) {
  const data = makePieData(summary)
  const waitPct = summary.averageWaitTimePercent.toFixed(1)

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
      <ResponsiveContainer width={140} height={130}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value">
            <Cell fill={COLORS.accent} />
            <Cell fill={COLORS.trafficRed} />
          </Pie>
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
            formatter={(v) => [`${v}%`]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-muted mt-1">
        Espera: <span className="text-traffic-red font-medium">{waitPct}%</span>
      </p>
    </div>
  )
}

export default function WaitTimePieChart({ seqSummary, parSummary }: WaitTimePieChartProps) {
  return (
    <Card>
      <h3 className="text-text-primary font-semibold text-sm mb-4">🥧 Movimiento vs espera en semáforos</h3>
      <div className="flex justify-around items-center">
        <MiniPie summary={seqSummary} label="Secuencial" color={COLORS.textSecondary} />

        <div className="flex flex-col items-center gap-2 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.accent }} />
            En movimiento
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS.trafficRed }} />
            Esperando
          </div>
        </div>

        <MiniPie summary={parSummary} label="Paralelo" color={COLORS.accent} />
      </div>
    </Card>
  )
}
