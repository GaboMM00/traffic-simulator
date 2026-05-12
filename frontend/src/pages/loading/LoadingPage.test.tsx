/** Tests para la pantalla de carga con etapas animadas. */

import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    p: ({ children, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...p}>{children}</p>,
  },
}))

import LoadingPage from './LoadingPage'

describe('LoadingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra el título "Iniciando Simulación"', () => {
    render(<LoadingPage />)
    expect(screen.getByText('Iniciando Simulación')).toBeInTheDocument()
  })

  it('muestra las 3 etapas de carga', () => {
    render(<LoadingPage />)
    expect(screen.getByText('Construyendo ciudad...')).toBeInTheDocument()
    expect(screen.getByText('Calculando rutas...')).toBeInTheDocument()
    expect(screen.getByText('Iniciando vehículos...')).toBeInTheDocument()
  })

  it('no muestra el banner de tardanza al inicio', () => {
    render(<LoadingPage />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('muestra el banner de tardanza tras 10 segundos', () => {
    render(<LoadingPage />)
    act(() => {
      vi.advanceTimersByTime(10001)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/tardando más de lo esperado/i)).toBeInTheDocument()
  })

  it('no muestra el banner de tardanza antes de 10 segundos', () => {
    render(<LoadingPage />)
    act(() => {
      vi.advanceTimersByTime(9999)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
