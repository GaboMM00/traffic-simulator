/** Pantalla de carga (estado LOADING) con 3 etapas animadas y barra de progreso. */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const STAGES = [
  'Construyendo ciudad...',
  'Calculando rutas...',
  'Iniciando vehículos...',
]

/** Duración de cada etapa en ms. La duración total coincide con estimatedLoadTimeMs típico (~800ms). */
const STAGE_DURATION_MS = 250

export default function LoadingPage() {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLong, setIsLong] = useState(false)

  // Cicla a través de las etapas animando la barra de progreso
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>
    let stageTimer: ReturnType<typeof setTimeout>

    const startStage = (current: number) => {
      setProgress(0)
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 100))
      }, STAGE_DURATION_MS / 10)

      stageTimer = setTimeout(() => {
        clearInterval(progressInterval)
        setProgress(100)
        if (current < STAGES.length - 1) {
          setTimeout(() => startStage(current + 1), 100)
          setStage(current + 1)
        }
      }, STAGE_DURATION_MS)
    }

    startStage(0)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(stageTimer)
    }
  }, [])

  // Avisa si tarda más de 10s (la API no respondió)
  useEffect(() => {
    const timer = setTimeout(() => setIsLong(true), 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full h-screen bg-background flex flex-col items-center justify-center gap-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm px-8"
      >
        <h2 className="text-text-primary text-xl font-semibold">Iniciando Simulación</h2>

        {STAGES.map((label, i) => (
          <div key={i} className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span
                className={
                  i === stage
                    ? 'text-accent'
                    : i < stage
                    ? 'text-traffic-green'
                    : 'text-text-muted'
                }
              >
                {label}
              </span>
              {i < stage && <span className="text-traffic-green">✓</span>}
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{
                  width: i < stage ? '100%' : i === stage ? `${progress}%` : '0%',
                }}
                transition={{ duration: 0.15 }}
              />
            </div>
          </div>
        ))}

        {isLong && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-traffic-yellow text-sm text-center"
            role="status"
          >
            Esto está tardando más de lo esperado...
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
