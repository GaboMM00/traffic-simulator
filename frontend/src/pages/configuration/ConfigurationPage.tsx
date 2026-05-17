/**
 * Pantalla de configuración (estado CONFIGURING).
 * Estructura como un wizard progresivo dentro de una sola página:
 *   PASO 1 → Tamaño del mapa
 *   PASO 2 → Modo de vehículos (AUTO o MANUAL)
 *   PASO 3 → Configuración del modo elegido + opciones de simulación
 *
 * En modo MANUAL el panel derecho se convierte en un mapa interactivo donde el
 * usuario clica las intersecciones de origen y destino para cada vehículo.
 * Durante el flujo de "agregar vehículo" el resto de los controles se bloquean.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import CitySection from './CitySection'
import VehiclesSection from './VehiclesSection'
import VehicleModeSelector from './VehicleModeSelector'
import ManualVehiclesPanel, { type AddingStage } from './ManualVehiclesPanel'
import SimulationSection from './SimulationSection'
import MapPreview from './MapPreview'
import InteractiveConfigMap from './InteractiveConfigMap'
import PresetButtons from './PresetButtons'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Toast from '../../components/ui/Toast'
import { useConfigStore } from '../../store/config.store'
import { useSimulation } from '../../hooks/useSimulation'
import { maxVehiclesForGrid } from '../../constants/simulation.constants'
import type { VehicleMode, ManualVehicle } from '../../types/config.types'

export default function ConfigurationPage() {
  const { config, setConfig, resetConfig } = useConfigStore()
  const { startSimulation } = useSimulation()

  const [stage, setStage]             = useState<AddingStage>('idle')
  const [pendingOrigin, setPendingOrigin] = useState<{ col: number; row: number } | null>(null)
  const [pendingMode, setPendingMode] = useState<VehicleMode | null>(null)
  const [toast, setToast]             = useState<{ message: string; visible: boolean }>({ message: '', visible: false })

  const isManual    = config.vehicleMode === 'MANUAL'
  const isAdding    = stage !== 'idle'
  const lockOthers  = isAdding
  const maxVehicles = maxVehiclesForGrid(config.gridSize)
  const reachedMax  = config.manualVehicles.length >= maxVehicles
  const canStart    = isManual ? config.manualVehicles.length >= 2 : true

  function showToast(message: string) {
    setToast({ message, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  // ── Flujo "agregar vehículo" ──────────────────────────────────
  function handleStartAdding() {
    if (reachedMax) return
    setStage('awaiting-origin')
    setPendingOrigin(null)
  }

  function handleCancelAdding() {
    setStage('idle')
    setPendingOrigin(null)
  }

  function handleIntersectionClick(col: number, row: number) {
    if (stage === 'awaiting-origin') {
      const isBorder = col === 0 || col === config.gridSize - 1 || row === 0 || row === config.gridSize - 1
      if (!isBorder) {
        showToast('El origen debe estar en el borde del mapa')
        return
      }
      setPendingOrigin({ col, row })
      setStage('awaiting-destination')
      return
    }
    if (stage === 'awaiting-destination' && pendingOrigin) {
      if (col === pendingOrigin.col && row === pendingOrigin.row) {
        showToast('El destino no puede ser igual al origen')
        return
      }
      const newVehicle: ManualVehicle = {
        id: `V-${String(config.manualVehicles.length + 1).padStart(3, '0')}`,
        originCol: pendingOrigin.col,
        originRow: pendingOrigin.row,
        destCol: col,
        destRow: row,
      }
      setConfig({ manualVehicles: [...config.manualVehicles, newVehicle] })
      setPendingOrigin(null)
      setStage('idle')
    }
  }

  function handleRemoveVehicle(id: string) {
    setConfig({
      manualVehicles: config.manualVehicles
        .filter((v) => v.id !== id)
        .map((v, i) => ({ ...v, id: `V-${String(i + 1).padStart(3, '0')}` })),
    })
  }

  // ── Cambio de modo AUTO ↔ MANUAL ──────────────────────────────
  function handleModeSelect(mode: VehicleMode) {
    if (mode === config.vehicleMode) return
    // De MANUAL → AUTO con vehículos definidos: confirmar
    if (config.vehicleMode === 'MANUAL' && mode === 'AUTO' && config.manualVehicles.length > 0) {
      setPendingMode(mode)
      return
    }
    setConfig({ vehicleMode: mode })
  }

  function confirmModeChange() {
    if (pendingMode === null) return
    setConfig({ vehicleMode: pendingMode, manualVehicles: [] })
    setPendingMode(null)
    setStage('idle')
    setPendingOrigin(null)
  }

  function handleReset() {
    resetConfig()
    setStage('idle')
    setPendingOrigin(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-screen bg-background overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Configurar Simulación</h1>
          <div className={lockOthers ? 'pointer-events-none opacity-50' : ''}>
            <PresetButtons />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-6">
          {/* Columna izquierda: secciones */}
          <div className="flex flex-col gap-6">
            <div className={lockOthers ? 'pointer-events-none opacity-50' : ''}>
              <CitySection />
            </div>

            <div className={lockOthers ? 'pointer-events-none opacity-50' : ''}>
              <VehicleModeSelector
                mode={config.vehicleMode}
                onSelect={handleModeSelect}
                disabled={lockOthers}
              />
            </div>

            {isManual ? (
              <ManualVehiclesPanel
                vehicles={config.manualVehicles}
                maxVehicles={maxVehicles}
                stage={stage}
                onStartAdding={handleStartAdding}
                onCancelAdding={handleCancelAdding}
                onRemove={handleRemoveVehicle}
              />
            ) : (
              <div className={lockOthers ? 'pointer-events-none opacity-50' : ''}>
                <VehiclesSection />
              </div>
            )}

            <div className={lockOthers ? 'pointer-events-none opacity-50' : ''}>
              <SimulationSection />
            </div>
          </div>

          {/* Columna derecha: preview o mapa interactivo */}
          <div className="lg:sticky lg:top-8 self-start">
            {isManual ? (
              <InteractiveConfigMap
                gridSize={config.gridSize}
                vehicles={config.manualVehicles}
                stage={stage}
                pendingOrigin={pendingOrigin}
                onIntersectionClick={handleIntersectionClick}
              />
            ) : (
              <MapPreview gridSize={config.gridSize} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={handleReset}
            disabled={lockOthers}
            className="text-text-secondary hover:text-text-primary text-sm transition-colors disabled:opacity-50"
          >
            Restablecer defaults
          </button>
          <div className="flex flex-col items-end gap-1">
            <Button
              size="lg"
              onClick={startSimulation}
              disabled={!canStart || lockOthers}
              aria-label="Iniciar simulación"
            >
              Iniciar Simulación
            </Button>
            {isManual && !canStart && (
              <span className="text-[11px] text-yellow-500">
                Agrega al menos 2 vehículos para iniciar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación al cambiar de MANUAL a AUTO con vehículos definidos */}
      <ConfirmDialog
        open={pendingMode !== null}
        title="¿Cambiar a automático?"
        message="Se perderán los vehículos configurados manualmente."
        confirmLabel="Sí, cambiar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmModeChange}
        onCancel={() => setPendingMode(null)}
      />

      {/* Toast informativo (origen fuera de borde, destino = origen, etc.) */}
      <Toast message={toast.message} type="error" visible={toast.visible} />
    </motion.div>
  )
}
