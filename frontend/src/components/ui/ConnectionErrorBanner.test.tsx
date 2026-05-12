/** Tests para el banner de error de conexión WebSocket. */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import ConnectionErrorBanner from './ConnectionErrorBanner'
import { useUiStore } from '../../store/ui.store'

describe('ConnectionErrorBanner', () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      showVehicleLabels: true,
      followVehicleId: null,
      selectedVehicleId: null,
      isFullscreen: false,
      connectionError: false,
    })
  })

  it('no muestra nada cuando connectionError=false', () => {
    render(<ConnectionErrorBanner />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el banner cuando connectionError=true', () => {
    useUiStore.setState({ connectionError: true })
    render(<ConnectionErrorBanner />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('el mensaje menciona la reconexión', () => {
    useUiStore.setState({ connectionError: true })
    render(<ConnectionErrorBanner />)
    expect(screen.getByText(/reconectar/i)).toBeInTheDocument()
  })

  it('el banner tiene aria-live="assertive"', () => {
    useUiStore.setState({ connectionError: true })
    render(<ConnectionErrorBanner />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('desaparece al volver connectionError=false', () => {
    useUiStore.setState({ connectionError: true })
    const { rerender } = render(<ConnectionErrorBanner />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    useUiStore.setState({ connectionError: false })
    rerender(<ConnectionErrorBanner />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
