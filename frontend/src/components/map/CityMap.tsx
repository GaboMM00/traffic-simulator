/**
 * Canvas principal del mapa usando Konva. Renderiza una simulación individual (SEQ o PAR).
 *
 * Optimizaciones para grids extremos:
 *   - Layers separados (grid estático cacheado; vehículos/semáforos en su propia capa)
 *   - Auto fit-to-screen cuando gridSize ≥ AUTO_FIT_GRID_THRESHOLD
 *   - Virtualización por viewport: solo se renderizan vehículos visibles
 *   - GridLayer se cachea como bitmap (no se redibuja en cada frame)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import GridLayer from './GridLayer'
import VehicleLayer from './VehicleLayer'
import TrafficLightLayer from './TrafficLightLayer'
import CongestionOverlay from './CongestionOverlay'
import { useMapControls } from '../../hooks/useMapControls'
import { AUTO_FIT_GRID_THRESHOLD, cellSizeForGrid } from '../../constants/simulation.constants'
import type { WorldStateDTO } from '../../types/metrics.types'

interface CityMapProps {
  gridSize: number
  width: number
  height: number
  worldState: WorldStateDTO | null
}

interface Viewport {
  minCol: number
  minRow: number
  maxCol: number
  maxRow: number
}

export default function CityMap({ gridSize, width, height, worldState }: CityMapProps) {
  const vehicles      = worldState?.vehicles ?? []
  const trafficLights = worldState?.trafficLights ?? []

  // CellSize: para grids grandes priorizamos el límite mínimo (6px) sobre el ajuste al viewport.
  // El usuario puede usar zoom/pan para navegar dentro del mapa total.
  const fittedCell = Math.floor(Math.min(width, height) / gridSize)
  const cellSize   = Math.max(fittedCell, cellSizeForGrid(gridSize))

  const { stageRef, handleWheel } = useMapControls({ width, height, cellSize })
  const gridLayerRef = useRef<Konva.Layer | null>(null)
  const [viewport, setViewport] = useState<Viewport | null>(null)

  /**
   * Calcula el bounding box visible (en cell units) a partir del Stage transform.
   * Se llama tras cualquier cambio de pan/zoom y al montar.
   */
  const recomputeViewport = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const scale = stage.scaleX()
    const pos   = stage.position()
    // Mundo visible (pixels) = stage rect (0..width, 0..height) → world coordinates
    const worldMinX = -pos.x / scale
    const worldMinY = -pos.y / scale
    const worldMaxX = (width  - pos.x) / scale
    const worldMaxY = (height - pos.y) / scale
    // Convertir píxeles a cell units con margen de 1 celda
    setViewport({
      minCol: Math.max(0, Math.floor(worldMinX / cellSize) - 1),
      minRow: Math.max(0, Math.floor(worldMinY / cellSize) - 1),
      maxCol: Math.min(gridSize - 1, Math.ceil(worldMaxX / cellSize) + 1),
      maxRow: Math.min(gridSize - 1, Math.ceil(worldMaxY / cellSize) + 1),
    })
  }, [stageRef, width, height, cellSize, gridSize])

  // Auto fit-to-screen en grids grandes: arranca con todo visible en lugar de un detalle parcial.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (gridSize >= AUTO_FIT_GRID_THRESHOLD) {
      const totalSize = gridSize * cellSize
      const scale = Math.min(width / totalSize, height / totalSize)
      stage.scale({ x: scale, y: scale })
      stage.position({ x: 0, y: 0 })
    } else {
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })
    }
    recomputeViewport()
  }, [gridSize, cellSize, width, height, stageRef, recomputeViewport])

  // Cachear el GridLayer como bitmap: es estático y muy costoso en grids grandes.
  // Konva.Layer.cache() lo convierte en un canvas único que se redibuja como imagen.
  useEffect(() => {
    const layer = gridLayerRef.current
    if (!layer) return
    // Esperar al próximo frame para que GridLayer haya renderizado sus shapes
    const raf = requestAnimationFrame(() => {
      try {
        layer.cache()
        layer.batchDraw()
      } catch {
        // si cache falla (canvas vacío), continuar sin cachear
      }
    })
    return () => {
      cancelAnimationFrame(raf)
      try { layer.clearCache() } catch { /* ignore */ }
    }
  }, [gridSize, cellSize])

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable
      onWheel={(e) => { handleWheel(e); recomputeViewport() }}
      onDragMove={recomputeViewport}
      onDragEnd={recomputeViewport}
      style={{ background: '#0d1117' }}
    >
      <Layer ref={gridLayerRef} listening={false}>
        <GridLayer gridSize={gridSize} cellSize={cellSize} />
      </Layer>
      <Layer listening={false}>
        <CongestionOverlay gridSize={gridSize} cellSize={cellSize} trafficLights={trafficLights} />
      </Layer>
      <Layer listening={false}>
        <TrafficLightLayer trafficLights={trafficLights} cellSize={cellSize} />
      </Layer>
      <Layer listening={false}>
        <VehicleLayer vehicles={vehicles} cellSize={cellSize} viewport={viewport} />
      </Layer>
    </Stage>
  )
}
