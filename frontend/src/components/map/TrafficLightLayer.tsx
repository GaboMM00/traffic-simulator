/** Capa de semáforos: renderiza todos los semáforos del grid. */

import TrafficLightShape from './TrafficLightShape'
import type { TrafficLightDTO } from '../../types/traffic-light.types'

interface TrafficLightLayerProps {
  trafficLights: TrafficLightDTO[]
  cellSize: number
}

export default function TrafficLightLayer({ trafficLights, cellSize }: TrafficLightLayerProps) {
  return (
    <>
      {trafficLights.map((tl) => (
        <TrafficLightShape key={tl.intersectionId} trafficLight={tl} cellSize={cellSize} />
      ))}
    </>
  )
}
