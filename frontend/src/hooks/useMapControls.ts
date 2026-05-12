/** Hook para controlar el zoom, pan y modo follow del canvas Konva. */

import { useRef, useCallback, useEffect } from 'react'
import type Konva from 'konva'
import { useUiStore } from '../store/ui.store'
import { useSimulationStore } from '../store/simulation.store'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 4
const ZOOM_FACTOR = 1.1
const FOLLOW_LERP = 0.1

interface MapControlsOptions {
  width?: number
  height?: number
  cellSize?: number
}

/**
 * Mantiene la referencia al stage de Konva y expone handlers para
 * zoom anclado al puntero, pan por arrastre nativo de Konva y modo follow
 * con interpolación suave (lerp 0.1) hacia la posición del vehículo objetivo.
 *
 * Si se pasan width/height/cellSize se habilita el follow loop. Sin ellos
 * la UI sigue funcionando para zoom/pan pero el follow queda inactivo.
 */
export function useMapControls(options: MapControlsOptions = {}) {
  const { width, height, cellSize } = options
  const stageRef = useRef<Konva.Stage | null>(null)
  const followVehicleId = useUiStore((s) => s.followVehicleId)
  const setFollowVehicleId = useUiStore((s) => s.setFollowVehicleId)

  /** Zoom centrado en la posición del puntero del mouse. */
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const rawScale = direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR
    const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, rawScale))

    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [])

  /** Resetea zoom a 1 y posición a (0,0). */
  const centerMap = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })
  }, [])

  /** Igual que centerMap porque el cellSize ya se calcula para el viewport. */
  const fitToScreen = useCallback(() => {
    centerMap()
  }, [centerMap])

  const followVehicle = useCallback(
    (vehicleId: string | null) => setFollowVehicleId(vehicleId),
    [setFollowVehicleId]
  )

  const cancelFollow = useCallback(
    () => setFollowVehicleId(null),
    [setFollowVehicleId]
  )

  // Loop de seguimiento: cada frame mueve el stage hacia la posición del vehículo
  // con lerp 0.1 para suavizar el desplazamiento. Solo activo si hay opciones de canvas.
  useEffect(() => {
    if (!followVehicleId || !width || !height || !cellSize) return

    let raf = 0
    const tick = () => {
      const stage = stageRef.current
      const ws = useSimulationStore.getState().worldState
      const v = ws?.vehicles.find((x) => x.id === followVehicleId)
      if (stage && v) {
        const scale = stage.scaleX()
        const targetX = width / 2 - (v.col * cellSize + cellSize / 2) * scale
        const targetY = height / 2 - (v.row * cellSize + cellSize / 2) * scale
        const cur = stage.position()
        stage.position({
          x: cur.x + (targetX - cur.x) * FOLLOW_LERP,
          y: cur.y + (targetY - cur.y) * FOLLOW_LERP,
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [followVehicleId, width, height, cellSize])

  // Tecla Escape cancela el follow.
  useEffect(() => {
    if (!followVehicleId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFollowVehicleId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [followVehicleId, setFollowVehicleId])

  return {
    stageRef,
    handleWheel,
    centerMap,
    fitToScreen,
    followVehicle,
    cancelFollow,
    isFollowing: followVehicleId !== null,
  }
}
