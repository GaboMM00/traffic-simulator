/** Forma visual de un vehículo individual con rotación, color y badge de líder. */

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

export default function VehicleShape({ vehicle, cellSize }: VehicleShapeProps) {
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
    </Group>
  )
}
