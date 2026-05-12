/** Tests para las tarjetas de métricas comparativas (SEQ vs PAR) de la pantalla de resultados. */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
}))

import MetricCards from './MetricCards'
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
  sequential: {
    durationMs: 24000,
    vehicles: [],
    summary: { ...fakeSummary, averageTravelTimeMs: 20000, averageWaitTimeMs: 5000, totalCompleted: 49 },
  },
  parallel: {
    durationMs: 21200,
    vehicles: [],
    summary: fakeSummary,
  },
}

describe('MetricCards', () => {
  it('muestra etiquetas SEQ y PAR en las tarjetas', () => {
    render(<MetricCards results={fakeResults} />)
    expect(screen.getAllByText('SEQ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('PAR').length).toBeGreaterThan(0)
  })

  it('muestra la intersección más congestionada', () => {
    render(<MetricCards results={fakeResults} />)
    expect(screen.getAllByText('I-4-6').length).toBeGreaterThan(0)
  })

  it('muestra el total completados del modo PAR', () => {
    render(<MetricCards results={fakeResults} />)
    expect(screen.getByText('50/50')).toBeInTheDocument()
  })

  it('muestra el speedup de rutas formateado', () => {
    render(<MetricCards results={fakeResults} />)
    // speedup = 340/89 = 3.82x
    expect(screen.getByText('3.82x')).toBeInTheDocument()
  })

  it('muestra los tiempos de duración de simulación', () => {
    render(<MetricCards results={fakeResults} />)
    // parallel.durationMs=21200 → 21.2s, sequential.durationMs=24000 → 24.0s
    expect(screen.getByText('21.2s')).toBeInTheDocument()
    expect(screen.getByText('24.0s')).toBeInTheDocument()
  })
})
