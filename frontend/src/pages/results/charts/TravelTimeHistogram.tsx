/** Histograma comparativo de distribución de tiempos de viaje — SEQ (gris) vs PAR (acento). */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card from '../../../components/ui/Card'
import type { VehicleResult } from '../../../types/simulation.types'
import { COLORS } from '../../../constants/colors'

interface TravelTimeHistogramProps {
  seqVehicles: VehicleResult[]
  parVehicles: VehicleResult[]
}

export default function TravelTimeHistogram({ seqVehicles, parVehicles }: TravelTimeHistogramProps) {
  const seqCompleted = seqVehicles.filter((v) => v.completed)
  const parCompleted = parVehicles.filter((v) => v.completed)
  if (seqCompleted.length === 0 && parCompleted.length === 0) return null

  const seqTimes = seqCompleted.map((v) => v.travelTimeMs / 1000)
  const parTimes = parCompleted.map((v) => v.travelTimeMs / 1000)
  const allTimes = [...seqTimes, ...parTimes]
  const min     = Math.min(...allTimes)
  const max     = Math.max(...allTimes)
  const bins    = 10
  const binSize = (max - min) / bins || 1

  const data = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * binSize
    const hi = lo + binSize
    return {
      range: `${lo.toFixed(0)}-${hi.toFixed(0)}s`,
      seq: seqTimes.filter((t) => t >= lo && t < hi).length,
      par: parTimes.filter((t) => t >= lo && t < hi).length,
    }
  })

  return (
    <Card>
      <h3 className="text-text-primary font-semibold text-sm mb-4">📊 Distribución de tiempos de viaje</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis dataKey="range" tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
          <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
            labelStyle={{ color: COLORS.textPrimary }}
          />
          <Legend wrapperStyle={{ color: COLORS.textSecondary, fontSize: 11 }} />
          <Bar dataKey="seq" name="Secuencial" fill={COLORS.textSecondary} radius={[2, 2, 0, 0]} />
          <Bar dataKey="par" name="Paralelo"   fill={COLORS.accent}         radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
