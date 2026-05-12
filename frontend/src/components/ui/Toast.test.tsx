/** Tests para el componente Toast con animación. */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import Toast from './Toast'

describe('Toast', () => {
  it('muestra el mensaje cuando visible=true', () => {
    render(<Toast message="Vehículo llegó" visible={true} />)
    expect(screen.getByText('Vehículo llegó')).toBeInTheDocument()
  })

  it('no renderiza nada cuando visible=false', () => {
    render(<Toast message="Oculto" visible={false} />)
    expect(screen.queryByText('Oculto')).not.toBeInTheDocument()
  })

  it('tiene role alert cuando es visible', () => {
    render(<Toast message="Alerta" visible={true} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('variante success aplica clase text-traffic-green', () => {
    render(<Toast message="OK" visible={true} type="success" />)
    expect(screen.getByRole('alert').className).toContain('text-traffic-green')
  })

  it('variante error aplica clase border-traffic-red', () => {
    render(<Toast message="Error" visible={true} type="error" />)
    expect(screen.getByRole('alert').className).toContain('border-traffic-red')
  })

  it('variante warning aplica clase text-traffic-yellow', () => {
    render(<Toast message="Warn" visible={true} type="warning" />)
    expect(screen.getByRole('alert').className).toContain('text-traffic-yellow')
  })

  it('usa info por defecto', () => {
    render(<Toast message="Info" visible={true} />)
    expect(screen.getByRole('alert').className).toContain('border-accent')
  })
})
