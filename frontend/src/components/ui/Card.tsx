/** Tarjeta contenedora con fondo y borde del tema oscuro. */

import { clsx } from 'clsx'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export default function Card({ className, children }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-xl p-4',
        className
      )}
    >
      {children}
    </div>
  )
}
