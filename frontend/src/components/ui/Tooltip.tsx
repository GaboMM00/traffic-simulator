/** Tooltip que aparece al hacer hover, usado para IDs de intersecciones y vehículos. */

import { useState } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-hover border border-border rounded text-xs text-text-primary whitespace-nowrap z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  )
}
