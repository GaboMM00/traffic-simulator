/**
 * Capa del grid: renderiza las calles y bloques con flechas de dirección del tráfico.
 * Implementa visualmente el sistema Manhattan alternado:
 *   - Filas pares  → flechas ESTE (→)
 *   - Filas impares→ flechas OESTE (←)
 *   - Cols pares   → flechas SUR (↓)
 *   - Cols impares → flechas NORTE (↑)
 *
 * En grids extremos (cellSize < 12) se omiten las flechas: serían ilegibles y
 * con 100×100 generarían ~40k Arrow nodes que colapsan Konva.
 */

import { useMemo } from 'react'
import { Line, Rect, Arrow } from 'react-konva'
import { COLORS } from '../../constants/colors'

interface GridLayerProps {
  gridSize: number
  cellSize: number
}

/** Umbral debajo del cual se omiten las flechas de dirección (ilegibles + costosas). */
const ARROW_RENDER_THRESHOLD = 12

export default function GridLayer({ gridSize, cellSize }: GridLayerProps) {
  const totalSize = gridSize * cellSize
  const arrowSize = Math.max(4, cellSize * 0.12)
  const streetW   = Math.max(1, cellSize * 0.3)
  const showArrows = cellSize >= ARROW_RENDER_THRESHOLD

  // Memo: las calles solo cambian cuando cambia gridSize o cellSize
  const streets = useMemo(() => {
    const out: React.ReactNode[] = []
    for (let row = 0; row < gridSize; row++) {
      out.push(
        <Line
          key={`h-${row}`}
          points={[0, row * cellSize + cellSize / 2, totalSize, row * cellSize + cellSize / 2]}
          stroke={COLORS.street}
          strokeWidth={streetW}
          listening={false}
        />
      )
    }
    for (let col = 0; col < gridSize; col++) {
      out.push(
        <Line
          key={`v-${col}`}
          points={[col * cellSize + cellSize / 2, 0, col * cellSize + cellSize / 2, totalSize]}
          stroke={COLORS.street}
          strokeWidth={streetW}
          listening={false}
        />
      )
    }
    return out
  }, [gridSize, cellSize, totalSize, streetW])

  // Las flechas solo se calculan si vamos a renderizarlas (memo evita el cálculo si showArrows=false)
  const arrows = useMemo(() => {
    if (!showArrows) return null
    const out: React.ReactNode[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize - 1; col++) {
        const isEast = row % 2 === 0
        const x = (col + (isEast ? 0.5 : 1.5)) * cellSize
        const y = row * cellSize + cellSize / 2
        const dx = isEast ? arrowSize : -arrowSize
        out.push(
          <Arrow
            key={`ah-${row}-${col}`}
            points={[x - dx / 2, y, x + dx / 2, y]}
            pointerLength={arrowSize * 0.7}
            pointerWidth={arrowSize * 0.5}
            fill={COLORS.streetLabel}
            stroke={COLORS.streetLabel}
            strokeWidth={1}
            opacity={0.4}
            listening={false}
          />
        )
      }
    }
    for (let col = 0; col < gridSize; col++) {
      for (let row = 0; row < gridSize - 1; row++) {
        const isSouth = col % 2 === 0
        const x = col * cellSize + cellSize / 2
        const y = (row + (isSouth ? 0.5 : 1.5)) * cellSize
        const dy = isSouth ? arrowSize : -arrowSize
        out.push(
          <Arrow
            key={`av-${col}-${row}`}
            points={[x, y - dy / 2, x, y + dy / 2]}
            pointerLength={arrowSize * 0.7}
            pointerWidth={arrowSize * 0.5}
            fill={COLORS.streetLabel}
            stroke={COLORS.streetLabel}
            strokeWidth={1}
            opacity={0.4}
            listening={false}
          />
        )
      }
    }
    return out
  }, [showArrows, gridSize, cellSize, arrowSize])

  return (
    <>
      <Rect x={0} y={0} width={totalSize} height={totalSize} fill={COLORS.background} listening={false} />
      {streets}
      {arrows}
    </>
  )
}
