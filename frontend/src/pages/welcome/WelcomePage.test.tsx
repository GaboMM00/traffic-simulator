/** Tests para la pantalla de bienvenida. */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import WelcomePage from './WelcomePage'
import { useSimulationStore } from '../../store/simulation.store'

vi.mock('./AnimatedBackground', () => ({ default: () => null }))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

describe('WelcomePage', () => {
  beforeEach(() => {
    useSimulationStore.setState({ appState: 'IDLE', simulationId: null, worldState: null, events: [], results: null })
  })

  it('muestra el título principal del simulador', () => {
    render(<WelcomePage />)
    expect(screen.getByText('Simulador de Tráfico Urbano')).toBeInTheDocument()
  })

  it('muestra el subtítulo de Programación Paralela', () => {
    render(<WelcomePage />)
    expect(screen.getByText('Programación Paralela y Concurrente')).toBeInTheDocument()
  })

  it('muestra el botón de nueva simulación', () => {
    render(<WelcomePage />)
    expect(screen.getByRole('button', { name: 'Iniciar nueva simulación' })).toBeInTheDocument()
  })

  it('al hacer clic en el botón cambia appState a CONFIGURING', async () => {
    render(<WelcomePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar nueva simulación' }))
    expect(useSimulationStore.getState().appState).toBe('CONFIGURING')
  })

  it('muestra el número de versión', () => {
    render(<WelcomePage />)
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })
})
