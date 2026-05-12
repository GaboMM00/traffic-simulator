/** Canvas principal del mapa usando Konva. Renderiza una simulación individual (SEQ o PAR). */

import { Stage, Layer } from 'react-konva'
import GridLayer from './GridLayer'
import VehicleLayer from './VehicleLayer'
import TrafficLightLayer from './TrafficLightLayer'
import CongestionOverlay from './CongestionOverlay'
import { useMapControls } from '../../hooks/useMapControls'
import type { WorldStateDTO } from '../../types/metrics.types'

interface CityMapProps {
  gridSize: number
  width: number
  height: number
  worldState: WorldStateDTO | null
}

export default function CityMap({ gridSize, width, height, worldState }: CityMapProps) {
  const vehicles     = worldState?.vehicles ?? []
  const trafficLights = worldState?.trafficLights ?? []
  const cellSize = Math.floor(Math.min(width, height) / gridSize)
  const { stageRef, handleWheel } = useMapControls({ width, height, cellSize })

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable
      onWheel={handleWheel}
      style={{ background: '#0d1117' }}
    >
      <Layer>
        <GridLayer gridSize={gridSize} cellSize={cellSize} />
      </Layer>
      <Layer>
        <CongestionOverlay gridSize={gridSize} cellSize={cellSize} trafficLights={trafficLights} />
      </Layer>
      <Layer>
        <TrafficLightLayer trafficLights={trafficLights} cellSize={cellSize} />
      </Layer>
      <Layer>
        <VehicleLayer vehicles={vehicles} cellSize={cellSize} />
      </Layer>
    </Stage>
  )
}
