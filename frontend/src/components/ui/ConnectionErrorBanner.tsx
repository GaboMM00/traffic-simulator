/** Banner rojo fijo en la parte superior cuando se pierde la conexión WebSocket. */

import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../store/ui.store'

export default function ConnectionErrorBanner() {
  const connectionError = useUiStore((s) => s.connectionError)

  return (
    <AnimatePresence>
      {connectionError && (
        <motion.div
          key="conn-error"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-50 bg-traffic-red/90 text-white text-sm font-medium text-center py-2 px-4"
          role="alert"
          aria-live="assertive"
        >
          Conexión perdida. Intentando reconectar...
        </motion.div>
      )}
    </AnimatePresence>
  )
}
