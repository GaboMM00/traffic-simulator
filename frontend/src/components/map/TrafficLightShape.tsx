/** Forma visual de un semáforo individual con color, glow y letra de accesibilidad. */

import { Circle, Text, Group } from 'react-konva'
import type { TrafficLightDTO } from '../../types/traffic-light.types'
import { getTrafficLightColor } from '../../utils/color.utils'
import { gridToPixel } from '../../utils/map.utils'
import { TRAFFIC_LIGHT_RADIUS_RATIO, TRAFFIC_LIGHT_GLOW_RATIO } from '../../constants/map.constants'

interface TrafficLightShapeProps {
  trafficLight: TrafficLightDTO
  cellSize: number
}

const STATE_LETTER = { GREEN: 'V', YELLOW: 'A', RED: 'R' } as const

export default function TrafficLightShape({ trafficLight, cellSize }: TrafficLightShapeProps) {
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
