/**
 * Forma visual de un semáforo individual.
 * Con cellSize ≥ 12px usa render rico (círculo + glow + letra de accesibilidad + ⚡).
 * Con cellSize pequeño cae a render minimalista (un punto de color) para escalar
 * a grids 100×100 sin colapsar el canvas.
 */

import { Circle, Text, Group, Rect } from 'react-konva'
import type { TrafficLightDTO } from '../../types/traffic-light.types'
import { getTrafficLightColor } from '../../utils/color.utils'
import { gridToPixel } from '../../utils/map.utils'
import { TRAFFIC_LIGHT_RADIUS_RATIO, TRAFFIC_LIGHT_GLOW_RATIO } from '../../constants/map.constants'

interface TrafficLightShapeProps {
  trafficLight: TrafficLightDTO
  cellSize: number
}

const STATE_LETTER = { GREEN: 'V', YELLOW: 'A', RED: 'R' } as const
/** Umbral debajo del cual se usa render minimalista (un píxel de color). */
const SIMPLE_RENDER_THRESHOLD = 12

export default function TrafficLightShape({ trafficLight, cellSize }: TrafficLightShapeProps) {
  if (cellSize < SIMPLE_RENDER_THRESHOLD) {
    return <SimpleTrafficLightShape trafficLight={trafficLight} cellSize={cellSize} />
  }
  return <RichTrafficLightShape trafficLight={trafficLight} cellSize={cellSize} />
}

/** Render rico con glow, círculo, letra de accesibilidad y badge ⚡ (smart). */
function RichTrafficLightShape({ trafficLight, cellSize }: TrafficLightShapeProps) {
  const { x, y } = gridToPixel(trafficLight.col, trafficLight.row, cellSize)
  const color = getTrafficLightColor(trafficLight.state)
  const radius = cellSize * TRAFFIC_LIGHT_RADIUS_RATIO
  const glowRadius = radius * TRAFFIC_LIGHT_GLOW_RATIO

  return (
    <Group x={x} y={y}>
      {/* Glow */}
      <Circle radius={glowRadius} fill={color} opacity={0.15} />
      {/* Círculo principal */}
      <Circle radius={radius} fill={color} />
      {/* Letra de accesibilidad */}
      <Text
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        text={STATE_LETTER[trafficLight.state]}
        fontSize={radius * 1.0}
        fill="white"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
      />
      {/* Ícono ⚡ si el semáforo inteligente está ajustando activamente esta fase */}
      {(trafficLight.isExtended || trafficLight.isReduced) && (
        <Text x={radius} y={-radius * 1.5} text="⚡" fontSize={radius * 1.2} />
      )}
    </Group>
  )
}

/**
 * Render minimalista para grids extremos (cellSize < 12).
 * Un cuadrado del color del estado, sin texto ni glow.
 * Cuando el semáforo inteligente está ajustando se le agrega un borde dorado fino.
 */
function SimpleTrafficLightShape({ trafficLight, cellSize }: TrafficLightShapeProps) {
  const { x, y } = gridToPixel(trafficLight.col, trafficLight.row, cellSize)
  const color = getTrafficLightColor(trafficLight.state)
  const size = Math.max(3, cellSize * 0.5)
  const smartActive = trafficLight.isExtended || trafficLight.isReduced

  return (
    <Rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill={color}
      stroke={smartActive ? '#f59e0b' : undefined}
      strokeWidth={smartActive ? 1 : 0}
      listening={false}
    />
  )
}
