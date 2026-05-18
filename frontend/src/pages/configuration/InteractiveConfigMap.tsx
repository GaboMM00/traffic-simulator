/**
 * Mapa interactivo SVG para definir vehículos manualmente.
 * Cada intersección del grid es un círculo clicable. Resalta los bordes durante
 * la selección de origen y muestra los pares ya agregados con líneas punteadas.
 */

import type { ManualVehicle } from '../../types/config.types'
import type { AddingStage } from './ManualVehiclesPanel'

interface InteractiveConfigMapProps {
  gridSize: number
  vehicles: ManualVehicle[]
  stage: AddingStage
  /** Origen ya marcado, esperando que el usuario clique el destino. */
  pendingOrigin: { col: number; row: number } | null
  /** Callback cuando el usuario hace clic en una intersección. */
  onIntersectionClick: (col: number, row: number) => void
}

const MAP_PIXEL_SIZE = 480
const PADDING        = 20

/**
 * Distribución de colores por vehículo, para que orígenes y destinos del mismo
 * vehículo compartan tono y se puedan distinguir entre sí en el mapa.
 */
const VEHICLE_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#fb7185',
] as const

export default function InteractiveConfigMap({
  gridSize, vehicles, stage, pendingOrigin, onIntersectionClick,
}: InteractiveConfigMapProps) {
  const inner    = MAP_PIXEL_SIZE - PADDING * 2
  const cellSize = gridSize > 1 ? inner / (gridSize - 1) : 0
  const isAdding = stage !== 'idle'

  const toX = (col: number) => PADDING + col * cellSize
  const toY = (row: number) => PADDING + row * cellSize

  function isBorder(col: number, row: number) {
    return col === 0 || col === gridSize - 1 || row === 0 || row === gridSize - 1
  }

  // Color por índice del vehículo en la lista
  function vehicleColor(index: number) {
    return VEHICLE_COLORS[index % VEHICLE_COLORS.length]
  }

  // Render lista de intersecciones
  const intersections: { col: number; row: number; key: string }[] = []
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      intersections.push({ col, row, key: `${col}-${row}` })
    }
  }

  // Marcadores activos: pendingOrigin + (origen, destino) de cada vehículo
  function isPending(col: number, row: number) {
    return pendingOrigin?.col === col && pendingOrigin?.row === row
  }

  return (
    <div
      className={[
        'relative bg-surface rounded-xl border-2 transition-all',
        isAdding ? 'border-accent shadow-[0_0_0_3px_var(--color-accent)/0.2]' : 'border-border',
      ].join(' ')}
      style={{ width: MAP_PIXEL_SIZE, maxWidth: '100%' }}
    >
      <svg
        width={MAP_PIXEL_SIZE}
        height={MAP_PIXEL_SIZE}
        viewBox={`0 0 ${MAP_PIXEL_SIZE} ${MAP_PIXEL_SIZE}`}
        className="w-full h-auto"
        aria-label="Mapa interactivo de configuración"
      >
        {/* Grid de calles (líneas suaves) */}
        <g stroke="#2a2f3a" strokeWidth={1} opacity={0.5}>
          {Array.from({ length: gridSize }, (_, i) => (
            <line key={`h-${i}`} x1={toX(0)} y1={toY(i)} x2={toX(gridSize - 1)} y2={toY(i)} />
          ))}
          {Array.from({ length: gridSize }, (_, i) => (
            <line key={`v-${i}`} x1={toX(i)} y1={toY(0)} x2={toX(i)} y2={toY(gridSize - 1)} />
          ))}
        </g>

        {/* Líneas punteadas: pares origen→destino de vehículos agregados */}
        <g>
          {vehicles.map((v, i) => (
            <line
              key={`route-${v.id}`}
              x1={toX(v.originCol)}
              y1={toY(v.originRow)}
              x2={toX(v.destCol)}
              y2={toY(v.destRow)}
              stroke={vehicleColor(i)}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          ))}
        </g>

        {/* Intersecciones clicables */}
        <g>
          {intersections.map(({ col, row, key }) => {
            const border    = isBorder(col, row)
            const pending   = isPending(col, row)
            // Hit area generosa para clic
            const hitR      = Math.max(cellSize / 2, 12)
            const visualR   = Math.max(cellSize / 6, 3)
            // Resalta los bordes durante selección de origen
            const highlight = stage === 'awaiting-origin' && border
            // Si está en awaiting-destination, deshabilita el origen pendiente
            const disabledPoint = stage === 'awaiting-destination' && pending

            const baseFill = border ? '#3b4252' : '#2a2f3a'
            const fill = pending
              ? '#34d399'
              : highlight
                ? '#5eead4'
                : baseFill

            const cursor = isAdding && !disabledPoint ? 'pointer' : 'default'

            return (
              <g key={key} style={{ cursor }}>
                {/* Hit area transparente */}
                <circle
                  cx={toX(col)}
                  cy={toY(row)}
                  r={hitR}
                  fill="transparent"
                  onClick={() => {
                    if (!isAdding || disabledPoint) return
                    onIntersectionClick(col, row)
                  }}
                />
                {/* Indicador visual */}
                <circle
                  cx={toX(col)}
                  cy={toY(row)}
                  r={visualR}
                  fill={fill}
                  stroke={highlight ? '#5eead4' : 'transparent'}
                  strokeWidth={highlight ? 1.5 : 0}
                  pointerEvents="none"
                />
              </g>
            )
          })}
        </g>

        {/* Marcadores de orígenes y destinos de vehículos ya agregados */}
        <g pointerEvents="none">
          {vehicles.map((v, i) => {
            const color = vehicleColor(i)
            return (
              <g key={`marker-${v.id}`}>
                {/* Origen — círculo verde con borde del color del vehículo */}
                <circle cx={toX(v.originCol)} cy={toY(v.originRow)} r={6} fill="#22c55e" stroke={color} strokeWidth={2} />
                {/* Destino — cuadrado rojo */}
                <rect
                  x={toX(v.destCol) - 6}
                  y={toY(v.destRow) - 6}
                  width={12}
                  height={12}
                  fill="#ef4444"
                  stroke={color}
                  strokeWidth={2}
                  rx={2}
                />
              </g>
            )
          })}

          {/* PendingOrigin: indicador verde grande con anillo pulsante */}
          {pendingOrigin && (
            <g>
              <circle cx={toX(pendingOrigin.col)} cy={toY(pendingOrigin.row)} r={9} fill="#22c55e" />
              <circle
                cx={toX(pendingOrigin.col)}
                cy={toY(pendingOrigin.row)}
                r={14}
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
                opacity={0.5}
              >
                <animate attributeName="r" values="9;18;9" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>
      </svg>

      {/* Leyenda */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-secondary">
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Origen</span>
        <span><span className="inline-block w-2 h-2 bg-red-500 mr-1" />Destino</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#3b4252] mr-1" />Borde (origen válido)</span>
      </div>
    </div>
  )
}
