/** Tipos relacionados con los semáforos en el canvas. */

export type TrafficLightState = 'GREEN' | 'YELLOW' | 'RED'

export interface TrafficLightDTO {
  intersectionId: string
  col: number
  row: number
  state: TrafficLightState
  remainingMs: number
  queueSize: number
  isExtended: boolean
}
