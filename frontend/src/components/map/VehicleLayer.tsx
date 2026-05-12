/** Capa de vehículos: renderiza todos los vehículos activos en el canvas. */

import VehicleShape from './VehicleShape'
import type { VehicleDTO } from '../../types/vehicle.types'

interface VehicleLayerProps {
  vehicles: VehicleDTO[]
  cellSize: number
}

export default function VehicleLayer({ vehicles, cellSize }: VehicleLayerProps) {
  return (
    <>
      {vehicles
        .filter((v) => v.state !== 'COMPLETED' && v.state !== 'NO_ROUTE')
        .map((vehicle) => (
          <VehicleShape key={vehicle.id} vehicle={vehicle} cellSize={cellSize} />
        ))}
    </>
  )
}
