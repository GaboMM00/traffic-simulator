/** Badge de estado para mostrar modos, estados y etiquetas en la UI. */

import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        {
          'bg-surface text-text-secondary border border-border': variant === 'default',
          'bg-traffic-green/20 text-traffic-green': variant === 'success',
          'bg-traffic-yellow/20 text-traffic-yellow': variant === 'warning',
          'bg-traffic-red/20 text-traffic-red': variant === 'danger',
          'bg-accent/20 text-accent': variant === 'info',
          'bg-gold/20 text-gold': variant === 'gold',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
