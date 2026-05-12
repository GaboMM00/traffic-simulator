/** Tests para el componente Badge. */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Badge from './Badge'

describe('Badge', () => {
  it('renderiza el texto hijo', () => {
    render(<Badge>RUNNING</Badge>)
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
  })

  it('variante default contiene bg-surface', () => {
    render(<Badge>default</Badge>)
    expect(screen.getByText('default').className).toContain('bg-surface')
  })

  it('variante success contiene text-traffic-green', () => {
    render(<Badge variant="success">OK</Badge>)
    expect(screen.getByText('OK').className).toContain('text-traffic-green')
  })

  it('variante warning contiene text-traffic-yellow', () => {
    render(<Badge variant="warning">WARN</Badge>)
    expect(screen.getByText('WARN').className).toContain('text-traffic-yellow')
  })

  it('variante danger contiene text-traffic-red', () => {
    render(<Badge variant="danger">ERROR</Badge>)
    expect(screen.getByText('ERROR').className).toContain('text-traffic-red')
  })

  it('variante info contiene text-accent', () => {
    render(<Badge variant="info">INFO</Badge>)
    expect(screen.getByText('INFO').className).toContain('text-accent')
  })

  it('variante gold contiene text-gold', () => {
    render(<Badge variant="gold">GOLD</Badge>)
    expect(screen.getByText('GOLD').className).toContain('text-gold')
  })

  it('acepta className adicional', () => {
    render(<Badge className="ml-2">Extra</Badge>)
    expect(screen.getByText('Extra').className).toContain('ml-2')
  })
})
