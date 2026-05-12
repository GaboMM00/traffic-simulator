/** Servicio WebSocket STOMP. Gestiona la conexión, suscripciones y reconexión automática. */

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { WorldStateDTO, SimulationEventDTO } from '../types/metrics.types'
import { WS_TOPICS } from '../constants/simulation.constants'

type WorldStateHandler = (data: WorldStateDTO) => void
type EventHandler = (data: SimulationEventDTO) => void
type StatusHandler = (connected: boolean) => void

export class WebSocketService {
  private client: Client | null = null
  private seqWorldStateHandlers: WorldStateHandler[] = []
  private parWorldStateHandlers: WorldStateHandler[] = []
  private eventHandlers: EventHandler[] = []
  private statusHandlers: StatusHandler[] = []

  connect() {
    if (this.client?.active) return
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
      reconnectDelay: 3000,
      onConnect: () => {
        this.statusHandlers.forEach((h) => h(true))
        this.subscribeToTopics()
      },
      onWebSocketClose: () => {
        this.statusHandlers.forEach((h) => h(false))
      },
      onStompError: () => {
        this.statusHandlers.forEach((h) => h(false))
      },
    })
    this.client.activate()
  }

  disconnect() {
    this.client?.deactivate()
    this.client = null
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }

  private subscribeToTopics() {
    if (!this.client?.connected) return

    this.client.subscribe(WS_TOPICS.WORLD_STATE_SEQ, (msg) => {
      const data: WorldStateDTO = JSON.parse(msg.body)
      this.seqWorldStateHandlers.forEach((h) => h(data))
    })

    this.client.subscribe(WS_TOPICS.WORLD_STATE_PAR, (msg) => {
      const data: WorldStateDTO = JSON.parse(msg.body)
      this.parWorldStateHandlers.forEach((h) => h(data))
    })

    this.client.subscribe(WS_TOPICS.EVENTS, (msg) => {
      const data: SimulationEventDTO = JSON.parse(msg.body)
      this.eventHandlers.forEach((h) => h(data))
    })
  }

  onSeqWorldState(handler: WorldStateHandler) {
    this.seqWorldStateHandlers.push(handler)
    return () => {
      this.seqWorldStateHandlers = this.seqWorldStateHandlers.filter((h) => h !== handler)
    }
  }

  onParWorldState(handler: WorldStateHandler) {
    this.parWorldStateHandlers.push(handler)
    return () => {
      this.parWorldStateHandlers = this.parWorldStateHandlers.filter((h) => h !== handler)
    }
  }

  onEvent(handler: EventHandler) {
    this.eventHandlers.push(handler)
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler)
    }
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler)
    }
  }
}

export const websocketService = new WebSocketService()
