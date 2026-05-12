/** Pantalla de bienvenida (estado IDLE). Muestra nombre del proyecto y botón de inicio. */

import { motion } from 'framer-motion'
import AnimatedBackground from './AnimatedBackground'
import Button from '../../components/ui/Button'
import { useSimulationStore } from '../../store/simulation.store'

export default function WelcomePage() {
  const setAppState = useSimulationStore((s) => s.setAppState)

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-6 text-center px-8"
      >
        <h1 className="text-5xl font-bold text-text-primary tracking-tight">
          Simulador de Tráfico Urbano
        </h1>
        <p className="text-text-secondary text-lg">Programación Paralela y Concurrente</p>

        <Button
          size="lg"
          onClick={() => setAppState('CONFIGURING')}
          className="mt-4 px-10"
          aria-label="Iniciar nueva simulación"
        >
          Nueva Simulación
        </Button>
      </motion.div>

      <div className="absolute bottom-6 text-text-muted text-xs z-10">
        v1.0.0
      </div>
    </div>
  )
}
