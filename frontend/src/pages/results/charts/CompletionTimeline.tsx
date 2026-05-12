/**
 * Línea de tiempo de llegadas — muestra cuándo completó el vehículo #N en SEQ vs PAR.
 * X: orden de llegada (1..n), Y: tiempo de viaje en segundos.
 * Permite comparar directamente si el modo paralelo completó vehículos más rápido.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card from '../../../components/ui/Card'
import type { VehicleResult } from '../../../types/simulation.types'
import { COLORS } from '../../../constants/colors'

interface CompletionTimelineProps {
  seqVehicles: VehicleResult[]
  parVehicles: VehicleResult[]
}

function sortedTimes(vehicles: VehicleResult[]): number[] {
  return vehicles
    .filter((v) => v.completed)
    .sort((a, b) => a.travelTimeMs - b.travelTimeMs)
    .map((v) => parseFloat((v.travelTimeMs / 1000).toFixed(1)))
}

export default function CompletionTimeline({ seqVehicles, parVehicles }: CompletionTimelineProps) {
  const seqTimes = sortedTimes(seqVehicles)
  const parTimes = sortedTimes(parVehicles)
  const maxLen   = Math.max(seqTimes.length, parTimes.length)

  if (maxLen === 0) return null

  const data = Array.from({ length: maxLen }, (_, i) => ({
    order: i + 1,
    seq: seqTimes[i] ?? null,
    par: parTimes[i] ?? null,
  }))

  return (
    <Card>
      <h3 className="text-text-primary font-semibold text-sm mb-4">📈 Tiempo de llegada por posición</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            dataKey="order"
            tick={{ fill: COLORS.textMuted, fontSize: 10 }}
            label={{ value: 'vehículo #', position: 'insideBottomRight', fill: COLORS.textMuted, fontSize: 9, dy: 4 }}
          />
          <YAxis
            tick={{ fill: COLORS.textMuted, fontSize: 10 }}
            label={{ value: 's', angle: -90, position: 'insideLeft', fill: COLORS.textMuted, fontSize: 10, dx: 18 }}
          />
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
            labelStyle={{ color: COLORS.textPrimary }}
            labelFormatter={(v) => `Vehículo #${v}`}
            formatter={(v: number) => [`${v}s`]}
          />
          <Legend wrapperStyle={{ color: COLORS.textSecondary, fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="seq"
            name="Secuencial"
            stroke={COLORS.textSecondary}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="par"
            name="Paralelo"
            stroke={COLORS.accent}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
