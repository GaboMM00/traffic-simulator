/** Modal de finalización que aparece cuando todos los vehículos completan su viaje. */

import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { useSimulationStore } from '../../store/simulation.store'
import { formatSeconds } from '../../utils/format.utils'

interface CompletionModalProps {
  onViewResults: () => void
  onReviewMap: () => void
}

export default function CompletionModal({ onViewResults, onReviewMap }: CompletionModalProps) {
  const results = useSimulationStore((s) => s.results)

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-6 max-w-md w-full mx-4"
      >
        <div className="text-4xl">🎉</div>
        <h2 className="text-text-primary text-2xl font-bold text-center">¡Simulación completada!</h2>

        {results?.parallel?.summary && (
          <div className="text-center">
            <p className="text-text-secondary text-sm">Primer lugar (PAR): <span className="text-gold font-semibold">{results.parallel.summary.firstVehicleId}</span></p>
            <p className="text-text-secondary text-sm">Tiempo: {formatSeconds(results.parallel.summary.firstVehicleTravelTimeMs)}</p>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onReviewMap}>
            Revisar mapa
          </Button>
          <Button className="flex-1" onClick={onViewResults}>
            Ver resultados
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
