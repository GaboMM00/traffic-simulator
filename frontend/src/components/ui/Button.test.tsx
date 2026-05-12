/** Tests para el componente Button. */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renderiza el texto hijo', () => {
    render(<Button>Haz clic</Button>)
    expect(screen.getByRole('button', { name: 'Haz clic' })).toBeInTheDocument()
  })

  it('variante primary contiene clase bg-accent por defecto', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button').className).toContain('bg-accent')
  })

  it('variante secondary contiene bg-surface y border', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-surface')
    expect(btn.className).toContain('border')
  })

  it('variante danger contiene bg-danger', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button').className).toContain('bg-danger')
  })

  it('tamaño lg contiene px-4 py-3', () => {
    render(<Button size="lg">Grande</Button>)
    expect(screen.getByRole('button').className).toContain('px-4')
  })

  it('botón deshabilitado tiene disabled:opacity-50 y no dispara onClick', async () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await userEvent.click(btn)
    expect(handler).not.toHaveBeenCalled()
  })

  it('llama onClick cuando no está deshabilitado', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('pasa atributo aria-label al elemento button', () => {
    render(<Button aria-label="Iniciar simulación">Iniciar</Button>)
    expect(screen.getByRole('button', { name: 'Iniciar simulación' })).toBeInTheDocument()
  })
})
