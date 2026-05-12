/** Tests para el heatmap de congestión por intersección. */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CongestionHeatmap from './CongestionHeatmap'
import type { SimulationSummary } from '../../../types/simulation.types'

const fakeSummary: SimulationSummary = {
  firstVehicleId: 'V-001',
  firstVehicleTravelTimeMs: 12400,
  averageTravelTimeMs: 18700,
  averageWaitTimeMs: 4100,
  averageWaitTimePercent: 21.9,
  totalCompleted: 50,
  totalVehicles: 50,
  mostCongestedIntersectionId: 'I-4-6',
  mostCongestedIntersectionWaits: 23,
}

describe('CongestionHeatmap', () => {
  it('renderiza el título del heatmap', () => {
    render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    expect(screen.getByText(/heatmap de congestión/i)).toBeInTheDocument()
  })

  it('muestra el ID de la intersección más congestionada', () => {
    render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    expect(screen.getByText('I-4-6')).toBeInTheDocument()
  })

  it('muestra el número de esperas', () => {
    render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    expect(screen.getByText(/23 esperas/)).toBeInTheDocument()
  })

  it('renderiza el SVG del grid', () => {
    const { container } = render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('role', 'img')
  })

  it('el SVG tiene gridSize² rectángulos (12×12=144)', () => {
    const { container } = render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(144)
  })

  it('el SVG tiene un círculo marcando el punto caliente', () => {
    const { container } = render(<CongestionHeatmap summary={fakeSummary} gridSize={12} />)
    const circle = container.querySelector('circle')
    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('stroke', '#f85149')
  })

  it('para gridSize=8 el SVG tiene 64 rectángulos', () => {
    const { container } = render(<CongestionHeatmap summary={fakeSummary} gridSize={8} />)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(64)
  })
})
