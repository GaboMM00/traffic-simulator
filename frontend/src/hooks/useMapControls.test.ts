/** Tests para useMapControls — modo follow, cancelación y handlers básicos. */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMapControls } from './useMapControls'
import { useUiStore } from '../store/ui.store'
import { useSimulationStore } from '../store/simulation.store'

function resetStores() {
  useUiStore.setState({
    sidebarCollapsed: false,
    showVehicleLabels: true,
    followVehicleId: null,
    selectedVehicleId: null,
    isFullscreen: false,
    connectionError: false,
  })
  useSimulationStore.setState({
    appState: 'IDLE',
    simulationId: null,
    worldState: null,
    liveMetrics: null,
    events: [],
    results: null,
  })
}

describe('useMapControls', () => {
  beforeEach(() => {
    resetStores()
  })

  it('isFollowing es false cuando no hay followVehicleId', () => {
    const { result } = renderHook(() => useMapControls())
    expect(result.current.isFollowing).toBe(false)
  })

  it('followVehicle cambia el followVehicleId del store', () => {
    const { result } = renderHook(() => useMapControls())
    act(() => {
      result.current.followVehicle('V-007')
    })
    expect(useUiStore.getState().followVehicleId).toBe('V-007')
    expect(result.current.isFollowing).toBe(true)
  })

  it('cancelFollow limpia el followVehicleId', () => {
    useUiStore.setState({ followVehicleId: 'V-001' })
    const { result } = renderHook(() => useMapControls())
    act(() => {
      result.current.cancelFollow()
    })
    expect(useUiStore.getState().followVehicleId).toBeNull()
  })

  it('tecla Escape cancela el follow activo', () => {
    useUiStore.setState({ followVehicleId: 'V-001' })
    renderHook(() => useMapControls())
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(useUiStore.getState().followVehicleId).toBeNull()
  })

  it('tecla Escape no hace nada si no hay follow activo', () => {
    renderHook(() => useMapControls())
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(useUiStore.getState().followVehicleId).toBeNull()
  })

  it('expone stageRef inicializado en null', () => {
    const { result } = renderHook(() => useMapControls())
    expect(result.current.stageRef.current).toBeNull()
  })

  it('handleWheel y centerMap no fallan sin stage montado', () => {
    const { result } = renderHook(() => useMapControls({ width: 800, height: 600, cellSize: 60 }))
    expect(() => result.current.centerMap()).not.toThrow()
    expect(() => result.current.fitToScreen()).not.toThrow()
  })

  it('centerMap resetea escala y posición del stage', () => {
    const fakeStage = {
      scale: vi.fn(),
      position: vi.fn(),
      scaleX: vi.fn().mockReturnValue(2),
    }
    const { result } = renderHook(() => useMapControls({ width: 800, height: 600, cellSize: 60 }))
    // @ts-expect-error inyectamos un stage fake para validar que invocamos sus métodos
    result.current.stageRef.current = fakeStage

    act(() => {
      result.current.centerMap()
    })

    expect(fakeStage.scale).toHaveBeenCalledWith({ x: 1, y: 1 })
    expect(fakeStage.position).toHaveBeenCalledWith({ x: 0, y: 0 })
  })

  it('handleWheel con deltaY positivo reduce el scale dentro del rango', () => {
    const fakeStage = {
      scaleX: vi.fn().mockReturnValue(1),
      x: vi.fn().mockReturnValue(0),
      y: vi.fn().mockReturnValue(0),
      scale: vi.fn(),
      position: vi.fn(),
      getPointerPosition: vi.fn().mockReturnValue({ x: 100, y: 100 }),
    }
    const { result } = renderHook(() => useMapControls())
    // @ts-expect-error inyectamos un stage fake
    result.current.stageRef.current = fakeStage

    const event = {
      evt: { preventDefault: vi.fn(), deltaY: 100 },
    }
    act(() => {
      // @ts-expect-error pasamos un KonvaEventObject minimalista
      result.current.handleWheel(event)
    })

    expect(event.evt.preventDefault).toHaveBeenCalled()
    const scaleArg = fakeStage.scale.mock.calls[0][0] as { x: number; y: number }
    expect(scaleArg.x).toBeLessThan(1)
    expect(scaleArg.x).toBeGreaterThanOrEqual(0.5)
  })
})
