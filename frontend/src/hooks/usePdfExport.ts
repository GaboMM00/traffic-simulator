/**
 * Hook que gestiona la exportación del reporte PDF.
 *
 * Flujo completo:
 *   1. El usuario hace clic en "Exportar PDF".
 *   2. isGenerating → true: el botón se deshabilita y muestra spinner.
 *   3. Se llama a generatePdfReport() del service con los datos y las refs del DOM.
 *   4. Al resolver: toast de éxito y isGenerating → false.
 *   5. Al rechazar: se loguea el error, toast de error y isGenerating → false.
 *
 * Toda la lógica de construcción del PDF vive en pdf-report.service.ts.
 * Este hook solo gestiona el estado de la UI (spinner, habilitación, toast).
 */

import { useState } from 'react'
import { generatePdfReport, type ChartRefs } from '../services/pdf-report.service'
import type { SimulationStopResponse } from '../types/simulation.types'
import type { SimulationConfig } from '../types/config.types'

interface ToastState {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

const TOAST_DURATION_MS = 4000

export function usePdfExport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  })

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type, visible: true })
    setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      TOAST_DURATION_MS
    )
  }

  async function exportPdf(
    results: SimulationStopResponse,
    config: SimulationConfig,
    refs: ChartRefs
  ) {
    setIsGenerating(true)
    try {
      await generatePdfReport(results, config, refs)
      showToast('PDF descargado correctamente', 'success')
    } catch (err) {
      console.error('Error al generar el PDF:', err)
      showToast('Error al generar el PDF', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, toast, exportPdf }
}
