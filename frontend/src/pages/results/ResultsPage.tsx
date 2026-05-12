/** Pantalla de resultados (estado RESULTS). Muestra métricas finales y gráficas con animación escalonada. */

import { useRef } from 'react'
import { motion } from 'framer-motion'
import MetricCards from './MetricCards'
import TravelTimeHistogram from './charts/TravelTimeHistogram'
import CompletionTimeline from './charts/CompletionTimeline'
import CongestionHeatmap from './charts/CongestionHeatmap'
import SequentialVsParallelChart from './charts/SequentialVsParallelChart'
import WaitTimePieChart from './charts/WaitTimePieChart'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { useSimulationStore } from '../../store/simulation.store'
import { useConfigStore } from '../../store/config.store'
import { useSimulation } from '../../hooks/useSimulation'
import { usePdfExport } from '../../hooks/usePdfExport'
import { exportReport } from '../../utils/export.utils'

export default function ResultsPage() {
  const results    = useSimulationStore((s) => s.results)
  const reset      = useSimulationStore((s) => s.reset)
  const setAppState = useSimulationStore((s) => s.setAppState)
  const { config } = useConfigStore()
  const { startSimulation } = useSimulation()

  // Referencias DOM para la captura html2canvas de cada gráfica
  const histogramRef    = useRef<HTMLDivElement>(null)
  const timelineRef     = useRef<HTMLDivElement>(null)
  const seqVsParRef     = useRef<HTMLDivElement>(null)
  const waitPieRef      = useRef<HTMLDivElement>(null)

  const { isGenerating, toast, exportPdf } = usePdfExport()

  if (!results) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <p className="text-text-muted">No hay resultados disponibles.</p>
      </div>
    )
  }

  function handleNewSimulation() {
    reset()
    setAppState('CONFIGURING')
  }

  async function handleRepeat() {
    reset()
    await startSimulation()
  }

  function handleExportPdf() {
    exportPdf(results!, config, {
      histogram:     histogramRef,
      timeline:      timelineRef,
      seqVsParallel: seqVsParRef,
      waitPie:       waitPieRef,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-background overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Resultados de la Simulación</h1>
          <p className="text-text-secondary text-sm mt-1">{results.simulationId}</p>
        </motion.div>

        <MetricCards results={results} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div ref={histogramRef}>
            <TravelTimeHistogram
              seqVehicles={results.sequential.vehicles}
              parVehicles={results.parallel.vehicles}
            />
          </div>
          <div ref={timelineRef}>
            <CompletionTimeline
              seqVehicles={results.sequential.vehicles}
              parVehicles={results.parallel.vehicles}
            />
          </div>
          <div ref={seqVsParRef}>
            <SequentialVsParallelChart
              sequential={results.sequential}
              parallel={results.parallel}
              routeCalculation={results.routeCalculation}
            />
          </div>
          <div ref={waitPieRef}>
            <WaitTimePieChart
              seqSummary={results.sequential.summary}
              parSummary={results.parallel.summary}
            />
          </div>
        </div>

        <div className="mt-6">
          <CongestionHeatmap summary={results.parallel.summary} gridSize={config.gridSize} />
        </div>

        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border">
          <Button variant="secondary" onClick={handleNewSimulation} aria-label="Nueva simulación">
            Nueva Simulación
          </Button>
          <Button variant="secondary" onClick={handleRepeat} aria-label="Repetir con mismos parámetros">
            Repetir simulación
          </Button>
          <Button
            variant="ghost"
            onClick={() => exportReport(results)}
            aria-label="Exportar reporte CSV y TXT"
          >
            ⬇ Exportar CSV / TXT
          </Button>
          <Button
            variant="ghost"
            onClick={handleExportPdf}
            disabled={isGenerating}
            aria-label="Exportar reporte PDF"
          >
            {isGenerating ? '⏳ Generando PDF...' : '📄 Exportar PDF'}
          </Button>
        </div>
      </div>

      <Toast
        message={toast.type === 'success' ? `✅ ${toast.message}` : `❌ ${toast.message}`}
        type={toast.type}
        visible={toast.visible}
      />
    </motion.div>
  )
}
