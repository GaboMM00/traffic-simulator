/**
 * Heatmap de congestión: overlay SVG sobre el grid mostrando el calor por intersección.
 * Colorea las intersecciones con gradiente frío→caliente según su distancia Manhattan
 * al punto más congestionado conocido. La intersección pico se marca con un círculo.
 */

import { useMemo } from 'react'
import Card from '../../../components/ui/Card'
import type { SimulationSummary } from '../../../types/simulation.types'

interface CongestionHeatmapProps {
  summary: SimulationSummary
  gridSize: number
}

/** Interpola entre dos colores RGB con factor t ∈ [0,1]. */
function lerpColor(cold: [number, number, number], hot: [number, number, number], t: number): string {
  const r = Math.round(cold[0] + (hot[0] - cold[0]) * t)
  const g = Math.round(cold[1] + (hot[1] - cold[1]) * t)
  const b = Math.round(cold[2] + (hot[2] - cold[2]) * t)
  return `rgb(${r},${g},${b})`
}

const COLD: [number, number, number] = [22, 27, 34]   // #161b22 (surface)
const HOT: [number, number, number]  = [248, 81, 73]  // #f85149 (trafficRed)

export default function CongestionHeatmap({ summary, gridSize }: CongestionHeatmapProps) {
  const { mostCongestedIntersectionId, mostCongestedIntersectionWaits } = summary

  // Parsear "I-{col}-{row}" al punto caliente
  const hotSpot = useMemo(() => {
    const parts = mostCongestedIntersectionId?.split('-')
    if (parts?.length === 3) {
      return { col: parseInt(parts[1], 10), row: parseInt(parts[2], 10) }
    }
    return null
  }, [mostCongestedIntersectionId])

  // Calcular calor de cada celda por distancia Manhattan al punto más congestionado
  const cells = useMemo(() => {
    const maxDist = hotSpot ? gridSize * 2 : 1
    const result: { col: number; row: number; heat: number }[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const dist = hotSpot
          ? Math.abs(col - hotSpot.col) + Math.abs(row - hotSpot.row)
          : maxDist
        // Raíz cuadrada suaviza la caída de calor con la distancia
        const heat = Math.max(0, 1 - Math.sqrt(dist / maxDist))
        result.push({ col, row, heat })
      }
    }
    return result
  }, [hotSpot, gridSize])

  const cellPx = Math.floor(240 / gridSize)
  const totalPx = cellPx * gridSize

  return (
    <Card className="col-span-2">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">🔥 Heatmap de congestión</h3>
        {mostCongestedIntersectionId && (
          <span className="text-xs text-text-secondary">
            Pico:{' '}
            <span className="text-traffic-red font-medium">{mostCongestedIntersectionId}</span>{' '}
            ({mostCongestedIntersectionWaits} esperas)
          </span>
        )}
      </div>

      <div className="flex justify-center items-start gap-3">
        <svg
          width={totalPx}
          height={totalPx}
          aria-label="Heatmap de congestión por intersección"
          role="img"
        >
          {cells.map(({ col, row, heat }) => (
            <rect
              key={`${col}-${row}`}
              x={col * cellPx}
              y={row * cellPx}
              width={cellPx - 1}
              height={cellPx - 1}
              fill={lerpColor(COLD, HOT, heat)}
              fillOpacity={0.5 + heat * 0.5}
              rx={1}
            />
          ))}
          {hotSpot && (
            <circle
              cx={hotSpot.col * cellPx + cellPx / 2}
              cy={hotSpot.row * cellPx + cellPx / 2}
              r={cellPx * 0.35}
              fill="none"
              stroke="#f85149"
              strokeWidth={2}
            />
          )}
        </svg>

        {/* Leyenda gradiente vertical */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className="text-xs text-traffic-red">Alto</span>
          <div
            className="w-3 rounded"
            style={{
              height: totalPx - 32,
              background: 'linear-gradient(to bottom, rgb(248,81,73), rgb(22,27,34))',
            }}
          />
          <span className="text-xs text-text-muted">Bajo</span>
        </div>
      </div>
    </Card>
  )
}
