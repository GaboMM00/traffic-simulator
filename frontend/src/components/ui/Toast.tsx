/** Notificación temporal con animación de entrada y salida. */

import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  visible: boolean
}

const COLORS: Record<string, string> = {
  info:    'bg-surface border-accent text-text-primary',
  success: 'bg-surface border-traffic-green text-traffic-green',
  warning: 'bg-surface border-traffic-yellow text-traffic-yellow',
  error:   'bg-surface border-traffic-red text-traffic-red',
}

export default function Toast({ message, type = 'info', visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border text-sm font-medium shadow-lg z-50 ${COLORS[type]}`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
