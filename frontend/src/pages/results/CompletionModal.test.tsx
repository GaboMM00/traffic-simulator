/** Tests para el modal de finalización de simulación. */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
}))

import CompletionModal from './CompletionModal'
import { useSimulationStore } from '../../store/simulation.store'
import type { SimulationStopResponse } from '../../types/simulation.types'

const fakeSummary = {
  firstVehicleId: 'V-007',
  firstVehicleTravelTimeMs: 12400,
  averageTravelTimeMs: 18700,
  averageWaitTimeMs: 4100,
  averageWaitTimePercent: 21.9,
  totalCompleted: 50,
  totalVehicles: 50,
  mostCongestedIntersectionId: 'I-4-6',
  mostCongestedIntersectionWaits: 23,
}

const fakeResults: SimulationStopResponse = {
  simulationId: 'SIM-001',
  completedAt: '2026-05-03T14:32:00',
  totalDurationMs: 45200,
  routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 89, speedup: 3.82 },
  sequential: { durationMs: 24000, vehicles: [], summary: fakeSummary },
  parallel: { durationMs: 21200, vehicles: [], summary: fakeSummary },
}

describe('CompletionModal', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      appState: 'FINISHING',
      simulationId: 'SIM-001',
      seqWorldState: null,
      parWorldState: null,
      events: [],
      results: fakeResults,
    })
  })

  it('muestra el título de simulación completada', () => {
    render(<CompletionModal onViewResults={vi.fn()} onReviewMap={vi.fn()} />)
    expect(screen.getByText('¡Simulación completada!')).toBeInTheDocument()
  })

  it('muestra el vehículo ganador cuando hay resultados', () => {
    render(<CompletionModal onViewResults={vi.fn()} onReviewMap={vi.fn()} />)
    expect(screen.getByText('V-007')).toBeInTheDocument()
  })

  it('muestra el tiempo del ganador en segundos', () => {
    render(<CompletionModal onViewResults={vi.fn()} onReviewMap={vi.fn()} />)
    expect(screen.getByText(/12\.4s/)).toBeInTheDocument()
  })

  it('llama onViewResults al hacer clic en Ver resultados', async () => {
    const onViewResults = vi.fn()
    render(<CompletionModal onViewResults={onViewResults} onReviewMap={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /ver resultados/i }))
    expect(onViewResults).toHaveBeenCalledOnce()
  })

  it('llama onReviewMap al hacer clic en Revisar mapa', async () => {
    const onReviewMap = vi.fn()
    render(<CompletionModal onViewResults={vi.fn()} onReviewMap={onReviewMap} />)
    await userEvent.click(screen.getByRole('button', { name: /revisar mapa/i }))
    expect(onReviewMap).toHaveBeenCalledOnce()
  })

  it('no muestra el ganador cuando results es null', () => {
    useSimulationStore.setState({ results: null })
    render(<CompletionModal onViewResults={vi.fn()} onReviewMap={vi.fn()} />)
    expect(screen.queryByText('V-007')).not.toBeInTheDocument()
  })
})
