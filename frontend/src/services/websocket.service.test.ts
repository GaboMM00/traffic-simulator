/** Tests para WebSocketService — mocks de @stomp/stompjs y sockjs-client. */

import { describe, it, expect, vi, beforeEach } from 'vitest'

interface FakeSubscription {
  topic: string
  callback: (msg: { body: string }) => void
}

const fakeClient = {
  active: false,
  connected: false,
  activate: vi.fn(),
  deactivate: vi.fn(),
  subscribe: vi.fn(),
  onConnect: undefined as (() => void) | undefined,
  onWebSocketClose: undefined as (() => void) | undefined,
  onStompError: undefined as (() => void) | undefined,
}

vi.mock('@stomp/stompjs', () => ({
  Client: class FakeClient {
    constructor(opts: {
      onConnect?: () => void
      onWebSocketClose?: () => void
      onStompError?: () => void
    }) {
      fakeClient.onConnect = opts.onConnect
      fakeClient.onWebSocketClose = opts.onWebSocketClose
      fakeClient.onStompError = opts.onStompError
      fakeClient.activate = vi.fn(() => {
        fakeClient.active = true
      })
      fakeClient.deactivate = vi.fn(() => {
        fakeClient.active = false
        fakeClient.connected = false
      })
      return fakeClient as unknown as FakeClient
    }
  },
}))

vi.mock('sockjs-client', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}))

import { WebSocketService } from './websocket.service'

function setupConnectedService(): {
  service: WebSocketService
  subscriptions: FakeSubscription[]
} {
  const subscriptions: FakeSubscription[] = []
  fakeClient.subscribe = vi.fn((topic: string, callback: (m: { body: string }) => void) => {
    subscriptions.push({ topic, callback })
    return { unsubscribe: vi.fn() }
  })
  const service = new WebSocketService()
  service.connect()
  fakeClient.connected = true
  fakeClient.onConnect?.()
  return { service, subscriptions }
}

describe('WebSocketService', () => {
  beforeEach(() => {
    fakeClient.connected = false
    fakeClient.active = false
    vi.clearAllMocks()
  })

  it('connect activa el cliente STOMP', () => {
    const service = new WebSocketService()
    service.connect()
    expect(fakeClient.activate).toHaveBeenCalledOnce()
  })

  it('al conectar notifica status=true y se suscribe a los canales SEQ, PAR y EVENTS', () => {
    const statusFn = vi.fn()
    const service = new WebSocketService()
    service.onStatus(statusFn)
    service.connect()
    fakeClient.connected = true
    fakeClient.onConnect?.()

    expect(statusFn).toHaveBeenCalledWith(true)
    const topics = fakeClient.subscribe.mock.calls.map((c) => c[0])
    expect(topics).toEqual(
      expect.arrayContaining([
        '/topic/world-state/seq',
        '/topic/world-state/par',
        '/topic/events',
      ])
    )
  })

  it('onWebSocketClose notifica status=false', () => {
    const statusFn = vi.fn()
    const service = new WebSocketService()
    service.onStatus(statusFn)
    service.connect()
    fakeClient.onWebSocketClose?.()
    expect(statusFn).toHaveBeenLastCalledWith(false)
  })

  it('reenvía mensajes /topic/world-state/seq al handler de SEQ', () => {
    const { subscriptions, service } = setupConnectedService()
    const handler = vi.fn()
    service.onSeqWorldState(handler)

    const sub = subscriptions.find((s) => s.topic === '/topic/world-state/seq')!
    sub.callback({ body: JSON.stringify({ tick: 5, simulationTimeMs: 1000, vehicles: [], trafficLights: [], metrics: {} }) })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].tick).toBe(5)
  })

  it('reenvía mensajes /topic/world-state/par al handler de PAR', () => {
    const { subscriptions, service } = setupConnectedService()
    const handler = vi.fn()
    service.onParWorldState(handler)

    const sub = subscriptions.find((s) => s.topic === '/topic/world-state/par')!
    sub.callback({ body: JSON.stringify({ tick: 7, simulationTimeMs: 2000, vehicles: [], trafficLights: [], metrics: {} }) })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].tick).toBe(7)
  })

  it('reenvía mensajes /topic/events al handler', () => {
    const { subscriptions, service } = setupConnectedService()
    const handler = vi.fn()
    service.onEvent(handler)

    const sub = subscriptions.find((s) => s.topic === '/topic/events')!
    sub.callback({ body: JSON.stringify({ type: 'VEHICLE_ARRIVED', timestamp: 1, payload: { vehicleId: 'V-001', mode: 'PARALLEL' } }) })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].type).toBe('VEHICLE_ARRIVED')
  })

  it('la función devuelta por onSeqWorldState desuscribe el handler', () => {
    const { subscriptions, service } = setupConnectedService()
    const handler = vi.fn()
    const unsub = service.onSeqWorldState(handler)
    unsub()

    const sub = subscriptions.find((s) => s.topic === '/topic/world-state/seq')!
    sub.callback({ body: '{"tick":1,"simulationTimeMs":1,"vehicles":[],"trafficLights":[],"metrics":{}}' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('disconnect desactiva el cliente', () => {
    const service = new WebSocketService()
    service.connect()
    service.disconnect()
    expect(fakeClient.deactivate).toHaveBeenCalledOnce()
  })

  it('isConnected refleja el estado del cliente STOMP', () => {
    const service = new WebSocketService()
    service.connect()
    fakeClient.connected = true
    expect(service.isConnected()).toBe(true)
    fakeClient.connected = false
    expect(service.isConnected()).toBe(false)
  })
})
