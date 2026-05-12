/** Tests para la pantalla de resultados. */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../utils/export.utils', () => ({
  exportReport: vi.fn(),
}))

vi.mock('../../hooks/useSimulation', () => ({
  useSimulation: () => ({ startSimulation: vi.fn() }),
}))

// Recharts mock
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

import ResultsPage from './ResultsPage'
import { useSimulationStore } from '../../store/simulation.store'
import { exportReport } from '../../utils/export.utils'
import type { SimulationStopResponse } from '../../types/simulation.types'

const fakeSummary = {
  firstVehicleId: 'V-001',
  firstVehicleTravelTimeMs: 12400,
  averageTravelTimeMs: 18700,
  averageWaitTimeMs: 4100,
  averageWaitTimePercent: 21.9,
  totalCompleted: 1,
  totalVehicles: 1,
  mostCongestedIntersectionId: 'I-4-6',
  mostCongestedIntersectionWaits: 23,
}

const fakeVehicles = [
  { vehicleId: 'V-001', arrivalOrder: 1, travelTimeMs: 12400, waitTimeMs: 3200, waitTimePercent: 25.8, routeLength: 14, completed: true },
]

const fakeResults: SimulationStopResponse = {
  simulationId: 'SIM-001',
  completedAt: '2026-05-03T14:32:00',
  totalDurationMs: 45200,
  routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 89, speedup: 3.82 },
  sequential: {
    durationMs: 24000,
    vehicles: fakeVehicles,
    summary: fakeSummary,
  },
  parallel: {
    durationMs: 21200,
    vehicles: fakeVehicles,
    summary: fakeSummary,
  },
}

describe('ResultsPage', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      appState: 'RESULTS',
      simulationId: 'SIM-001',
      seqWorldState: null,
      parWorldState: null,
      events: [],
      results: fakeResults,
    })
    vi.clearAllMocks()
  })

  it('muestra el título de resultados', () => {
    render(<ResultsPage />)
    expect(screen.getByText('Resultados de la Simulación')).toBeInTheDocument()
  })

  it('muestra el ID de simulación', () => {
    render(<ResultsPage />)
    expect(screen.getByText('SIM-001')).toBeInTheDocument()
  })

  it('renderiza los botones de acción', () => {
    render(<ResultsPage />)
    expect(screen.getByRole('button', { name: 'Nueva simulación' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Repetir con mismos parámetros' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar reporte CSV y TXT' })).toBeInTheDocument()
  })

  it('el botón exportar llama a exportReport con los resultados', async () => {
    render(<ResultsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Exportar reporte CSV y TXT' }))
    expect(exportReport).toHaveBeenCalledWith(fakeResults)
  })

  it('el botón Nueva Simulación resetea y va a CONFIGURING', async () => {
    render(<ResultsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Nueva simulación' }))
    expect(useSimulationStore.getState().appState).toBe('CONFIGURING')
    expect(useSimulationStore.getState().results).toBeNull()
  })

  it('muestra mensaje sin resultados cuando results es null', () => {
    useSimulationStore.setState({ results: null })
    render(<ResultsPage />)
    expect(screen.getByText('No hay resultados disponibles.')).toBeInTheDocument()
  })
})
