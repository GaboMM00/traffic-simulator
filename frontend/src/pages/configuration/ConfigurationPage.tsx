/** Pantalla de configuración (estado CONFIGURING). Una sola página con 3 secciones. */

import { motion } from 'framer-motion'
import CitySection from './CitySection'
import VehiclesSection from './VehiclesSection'
import SimulationSection from './SimulationSection'
import MapPreview from './MapPreview'
import PresetButtons from './PresetButtons'
import Button from '../../components/ui/Button'
import { useConfigStore } from '../../store/config.store'
import { useSimulation } from '../../hooks/useSimulation'

export default function ConfigurationPage() {
  const { config, resetConfig } = useConfigStore()
  const { startSimulation } = useSimulation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-screen bg-background overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Configurar Simulación</h1>
          <PresetButtons />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-6">
            <CitySection />
            <VehiclesSection />
            <SimulationSection />
          </div>
          <MapPreview gridSize={config.gridSize} />
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={resetConfig}
            className="text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            Restablecer defaults
          </button>
          <Button size="lg" onClick={startSimulation} aria-label="Iniciar simulación">
            Iniciar Simulación
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
