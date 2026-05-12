/**
 * Capa del grid: renderiza las calles y bloques con flechas de dirección del tráfico.
 * Implementa visualmente el sistema Manhattan alternado:
 *   - Filas pares  → flechas ESTE (→)
 *   - Filas impares→ flechas OESTE (←)
 *   - Cols pares   → flechas SUR (↓)
 *   - Cols impares → flechas NORTE (↑)
 */

import { Line, Rect, Arrow } from 'react-konva'
import { COLORS } from '../../constants/colors'

interface GridLayerProps {
  gridSize: number
  cellSize: number
}

export default function GridLayer({ gridSize, cellSize }: GridLayerProps) {
  const totalSize = gridSize * cellSize
  const arrowSize = Math.max(4, cellSize * 0.12)
  const streetW   = cellSize * 0.3

  return (
    <>
      {/* Fondo general */}
      <Rect x={0} y={0} width={totalSize} height={totalSize} fill={COLORS.background} />

      {/* Calles horizontales */}
      {Array.from({ length: gridSize }, (_, row) => (
        <Line
          key={`h-${row}`}
          points={[0, row * cellSize + cellSize / 2, totalSize, row * cellSize + cellSize / 2]}
          stroke={COLORS.street}
          strokeWidth={streetW}
        />
      ))}

      {/* Calles verticales */}
      {Array.from({ length: gridSize }, (_, col) => (
        <Line
          key={`v-${col}`}
          points={[col * cellSize + cellSize / 2, 0, col * cellSize + cellSize / 2, totalSize]}
          stroke={COLORS.street}
          strokeWidth={streetW}
        />
      ))}

      {/* Flechas de dirección horizontal (una por celda de cada fila) */}
      {Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize - 1 }, (__, col) => {
          // Fila par → ESTE, fila impar → OESTE
          const isEast = row % 2 === 0
          const x = (col + (isEast ? 0.5 : 1.5)) * cellSize
          const y = row * cellSize + cellSize / 2
          const dx = isEast ? arrowSize : -arrowSize

          return (
            <Arrow
              key={`ah-${row}-${col}`}
              points={[x - dx / 2, y, x + dx / 2, y]}
              pointerLength={arrowSize * 0.7}
              pointerWidth={arrowSize * 0.5}
              fill={COLORS.streetLabel}
              stroke={COLORS.streetLabel}
              strokeWidth={1}
              opacity={0.4}
            />
          )
        })
      )}

      {/* Flechas de dirección vertical (una por celda de cada columna) */}
      {Array.from({ length: gridSize }, (_, col) =>
        Array.from({ length: gridSize - 1 }, (__, row) => {
          // Col par → SUR, col impar → NORTE
          const isSouth = col % 2 === 0
          const x = col * cellSize + cellSize / 2
          const y = (row + (isSouth ? 0.5 : 1.5)) * cellSize
          const dy = isSouth ? arrowSize : -arrowSize

          return (
            <Arrow
              key={`av-${col}-${row}`}
              points={[x, y - dy / 2, x, y + dy / 2]}
              pointerLength={arrowSize * 0.7}
              pointerWidth={arrowSize * 0.5}
              fill={COLORS.streetLabel}
              stroke={COLORS.streetLabel}
              strokeWidth={1}
              opacity={0.4}
            />
          )
        })
      )}
    </>
  )
}
