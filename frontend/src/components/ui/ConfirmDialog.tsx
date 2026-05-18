/** Diálogo modal genérico para confirmar acciones destructivas. */

import { AnimatePresence, motion } from 'framer-motion'
import Button from './Button'

interface ConfirmDialogProps {
  /** Visible cuando es true. */
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Variante del botón de confirmar; danger para acciones destructivas. */
  variant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal centrado con backdrop semitransparente. Cierra al hacer clic en el backdrop
 * o presionar Cancel. Se anima con framer-motion para que aparezca suavemente.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            className="bg-surface border border-border rounded-2xl shadow-xl p-6 max-w-md mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-dialog-title" className="text-text-primary font-semibold text-lg mb-2">
              {title}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">{message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
