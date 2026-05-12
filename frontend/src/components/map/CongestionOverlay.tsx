/** Overlay de congestión: muestra un heatmap de las intersecciones más congestionadas. */

import { Rect } from 'react-konva'
import type { TrafficLightDTO } from '../../types/traffic-light.types'
import { COLORS } from '../../constants/colors'

interface CongestionOverlayProps {
  gridSize: number
  cellSize: number
  trafficLights: TrafficLightDTO[]
}

export default function CongestionOverlay({ cellSize, trafficLights }: CongestionOverlayProps) {
  const maxQueue = Math.max(1, ...trafficLights.map((tl) => tl.queueSize))

  return (
    <>
      {trafficLights
        .filter((tl) => tl.queueSize > 0)
        .map((tl) => {
          const intensity = tl.queueSize / maxQueue
          return (
            <Rect
              key={`overlay-${tl.intersectionId}`}
              x={tl.col * cellSize}
              y={tl.row * cellSize}
              width={cellSize}
              height={cellSize}
              fill={COLORS.trafficRed}
              opacity={intensity * 0.3}
            />
          )
        })}
    </>
  )
}
