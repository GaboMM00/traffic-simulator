/** Botón reutilizable con variantes de estilo para el tema oscuro del simulador. */

import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2',
        {
          'bg-accent hover:bg-accent-hover text-white': variant === 'primary',
          'bg-surface hover:bg-surface-hover border border-border text-text-primary': variant === 'secondary',
          'bg-danger hover:opacity-90 text-white': variant === 'danger',
          'hover:bg-surface-hover text-text-secondary hover:text-text-primary': variant === 'ghost',
          'text-xs px-2 py-1': size === 'sm',
          'text-sm px-3 py-2': size === 'md',
          'text-base px-4 py-3': size === 'lg',
        },
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
