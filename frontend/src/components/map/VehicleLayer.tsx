/**
 * Capa de vehículos: renderiza solo los vehículos visibles en el viewport actual.
 *
 * Con grids extremos (100×100 + 2000 vehículos) renderizar todos los Konva nodes
 * en cada frame colapsa el browser. Aplicamos virtualización: el bounding box del
 * viewport (en coordenadas de mundo) se calcula a partir del Stage transform y
 * solo se renderizan los vehículos cuyo (col, row) cae dentro de ese rect.
 *
 * La virtualización se activa solo cuando la cantidad de vehículos supera el
 * umbral configurable, para evitar overhead innecesario en cargas pequeñas.
 */

import { useMemo } from 'react'
import VehicleShape from './VehicleShape'
import type { VehicleDTO } from '../../types/vehicle.types'

interface Viewport {
  /** Origen del viewport en coordenadas del mundo (cell units, no píxeles). */
  minCol: number
  minRow: number
  maxCol: number
  maxRow: number
}

interface VehicleLayerProps {
  vehicles: VehicleDTO[]
  cellSize: number
  /** Si se provee, se aplica virtualización por bounding box. */
  viewport?: Viewport | null
  /** Umbral de vehículos a partir del cual virtualizar (default 500). */
  virtualizationThreshold?: number
}

export default function VehicleLayer({
  vehicles, cellSize, viewport, virtualizationThreshold = 500,
}: VehicleLayerProps) {
  const visible = useMemo(() => {
    const filtered = vehicles.filter((v) => v.state !== 'COMPLETED' && v.state !== 'NO_ROUTE')
    // Aplicar virtualización solo si vale la pena (carga grande + viewport conocido)
    if (!viewport || filtered.length < virtualizationThreshold) return filtered
    return filtered.filter((v) =>
      v.col >= viewport.minCol && v.col <= viewport.maxCol &&
      v.row >= viewport.minRow && v.row <= viewport.maxRow
    )
  }, [vehicles, viewport, virtualizationThreshold])

  return (
    <>
      {visible.map((vehicle) => (
        <VehicleShape key={vehicle.id} vehicle={vehicle} cellSize={cellSize} />
      ))}
    </>
  )
}
