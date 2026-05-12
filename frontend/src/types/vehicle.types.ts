/** Tipos relacionados con los vehículos en el canvas y la simulación. */

export type VehicleState = 'CALCULATING' | 'MOVING' | 'WAITING' | 'COMPLETED' | 'NO_ROUTE'

export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

export interface VehicleDTO {
  id: string
  col: number
  row: number
  prevCol: number
  prevRow: number
  direction: Direction
  state: VehicleState
  colorIndex: number
  isLeader: boolean
  travelTimeMs: number
  waitTimeMs: number
}
