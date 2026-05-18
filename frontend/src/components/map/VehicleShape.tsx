/**
 * Forma visual de un vehículo individual.
 * Con cellSize grande (≥12px) usa render rico (rect redondeado + ID + animación de pulse).
 * Con cellSize pequeño (<12px, grids extremos) cae a render minimalista: solo un Rect
 * estático sin estado React, lo que permite escalar a 2000 vehículos sin colapsar.
 */

import { useState, useEffect } from 'react'
import { Rect, Text, Group } from 'react-konva'
import type { VehicleDTO } from '../../types/vehicle.types'
import { getVehicleColor } from '../../utils/color.utils'
import { gridToPixel, directionToAngle } from '../../utils/map.utils'
import { COLORS } from '../../constants/colors'
import { VEHICLE_WIDTH_RATIO, VEHICLE_HEIGHT_RATIO } from '../../constants/map.constants'

interface VehicleShapeProps {
  vehicle: VehicleDTO
  cellSize: number
}

/** Umbral debajo del cual se usa render minimalista (rectángulo simple, sin estado). */
const SIMPLE_RENDER_THRESHOLD = 12
/** Umbral debajo del cual se omite el label con el ID del vehículo. */
const LABEL_THRESHOLD = 16

export default function VehicleShape({ vehicle, cellSize }: VehicleShapeProps) {
  if (cellSize < SIMPLE_RENDER_THRESHOLD) {
    return <SimpleVehicleShape vehicle={vehicle} cellSize={cellSize} />
  }
  return <RichVehicleShape vehicle={vehicle} cellSize={cellSize} />
}

/**
 * Render rico para grids pequeños/medianos (cellSize ≥ 12).
 * Mantiene la animación de pulse para vehículos en CALCULATING y el badge de líder.
 */
function RichVehicleShape({ vehicle, cellSize }: VehicleShapeProps) {
  const { x, y } = gridToPixel(vehicle.col, vehicle.row, cellSize)
  const color = getVehicleColor(vehicle.colorIndex)
  const vw = cellSize * VEHICLE_WIDTH_RATIO
  const vh = cellSize * VEHICLE_HEIGHT_RATIO
  const rotation = directionToAngle(vehicle.direction)

  const isCalculating = vehicle.state === 'CALCULATING'
  const [pulseScale, setPulseScale] = useState(1)

  useEffect(() => {
    if (!isCalculating) {
      setPulseScale(1)
      return
    }
    const id = setInterval(() => {
      setPulseScale((s) => (s === 1 ? 0.95 : 1))
    }, 400)
    return () => clearInterval(id)
  }, [isCalculating])

  const opacity = isCalculating ? 0.6 : vehicle.state === 'WAITING' ? 0.5 : 1
  const showLabel = cellSize >= LABEL_THRESHOLD

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      opacity={opacity}
      scaleX={pulseScale}
      scaleY={pulseScale}
    >
      <Rect
        x={-vw / 2}
        y={-vh / 2}
        width={vw}
        height={vh}
        fill={color}
        cornerRadius={vw * 0.3}
        stroke={vehicle.isLeader ? COLORS.gold : isCalculating ? COLORS.textSecondary : undefined}
        strokeWidth={vehicle.isLeader || isCalculating ? 2 : 0}
        dash={isCalculating ? [4, 4] : undefined}
      />
      {showLabel && (
        <Text
          x={-vw / 2}
          y={-vh / 2}
          width={vw}
          height={vh}
          text={vehicle.id.replace('V-', '')}
          fontSize={cellSize * 0.12}
          fill={COLORS.textPrimary}
          align="center"
          verticalAlign="middle"
        />
      )}
    </Group>
  )
}

/**
 * Render minimalista para grids extremos (cellSize < 12).
 * Solo un Rect simple: sin estado React, sin animaciones, sin label.
 * Garantiza fluidez visual con 1000+ vehículos en pantalla.
 */
function SimpleVehicleShape({ vehicle, cellSize }: VehicleShapeProps) {
  const { x, y } = gridToPixel(vehicle.col, vehicle.row, cellSize)
  const color = getVehicleColor(vehicle.colorIndex)
  // Vehículo mínimo: 2x3 px aproximadamente, con piso de visibilidad
  const vw = Math.max(2, cellSize * 0.6)
  const vh = Math.max(3, cellSize * 0.8)
  const opacity = vehicle.state === 'WAITING' ? 0.5 : vehicle.state === 'CALCULATING' ? 0.6 : 1

  return (
    <Rect
      x={x - vw / 2}
      y={y - vh / 2}
      width={vw}
      height={vh}
      fill={color}
      opacity={opacity}
      stroke={vehicle.isLeader ? COLORS.gold : undefined}
      strokeWidth={vehicle.isLeader ? 1 : 0}
      listening={false}
    />
  )
}
