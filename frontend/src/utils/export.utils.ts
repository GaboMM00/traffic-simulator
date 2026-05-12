/** Utilidades de exportación de reportes: genera CSV y TXT comparativos (SEQ vs PAR). */

import type { SimulationStopResponse, SimulationSummary, VehicleResult } from '../types/simulation.types'

function vehicleRows(vehicles: VehicleResult[]): string[] {
  return vehicles.map((v) =>
    [v.vehicleId, v.arrivalOrder, v.travelTimeMs, v.waitTimeMs, v.waitTimePercent.toFixed(1), v.routeLength, v.completed].join(',')
  )
}

function summaryRow(id: string, mode: string, durationMs: number, s: SimulationSummary, routeSeqMs: number, routeParMs: number): string {
  const speedup = routeParMs > 0 ? (routeSeqMs / routeParMs).toFixed(2) : 'N/A'
  return [
    id, mode, durationMs, s.totalVehicles, s.totalCompleted,
    s.averageTravelTimeMs.toFixed(0), s.averageWaitTimeMs.toFixed(0),
    s.averageWaitTimePercent.toFixed(1),
    routeSeqMs, routeParMs, speedup,
    s.firstVehicleId, s.firstVehicleTravelTimeMs,
    s.mostCongestedIntersectionId, s.mostCongestedIntersectionWaits,
  ].join(',')
}

/**
 * Construye el CSV con tres secciones: resumen comparativo, vehículos SEQ y vehículos PAR.
 * Función pura — no tiene side effects, solo devuelve el string.
 */
export function buildCsvReport(results: SimulationStopResponse): string {
  const { sequential, parallel, routeCalculation, simulationId } = results
  const VEHICLE_HEADER = 'vehicleId,arrivalOrder,travelTimeMs,waitTimeMs,waitPercent,routeLength,completed'
  const SUMMARY_HEADER = 'simulationId,gridSize,vehicleCount,modo,durationMs,totalVehicles,totalCompleted,avgTravelTimeMs,avgWaitTimeMs,avgWaitPercent,routeSeqMs,routeParMs,routeSpeedup,firstVehicleId,firstVehicleTravelTimeMs,mostCongestedId,mostCongestedWaits'

  const lines: string[] = [
    '# REPORTE DUAL — SECUENCIAL vs PARALELO',
    `# ID: ${simulationId}`,
    '',
    '# RESUMEN COMPARATIVO',
    SUMMARY_HEADER,
    summaryRow(simulationId, 'SECUENCIAL', sequential.durationMs, sequential.summary, routeCalculation.sequentialTimeMs, routeCalculation.parallelTimeMs),
    summaryRow(simulationId, 'PARALELO',   parallel.durationMs,   parallel.summary,   routeCalculation.sequentialTimeMs, routeCalculation.parallelTimeMs),
    '',
    '# VEHÍCULOS MODO SECUENCIAL',
    VEHICLE_HEADER,
    ...vehicleRows(sequential.vehicles),
    '',
    '# VEHÍCULOS MODO PARALELO',
    VEHICLE_HEADER,
    ...vehicleRows(parallel.vehicles),
  ]

  return lines.join('\n')
}

/**
 * Construye el reporte TXT con formato fijo comparando ambos modos lado a lado.
 * Función pura — no tiene side effects, solo devuelve el string.
 */
export function buildTxtReport(results: SimulationStopResponse): string {
  const { sequential, parallel, routeCalculation, simulationId, completedAt, totalDurationMs } = results
  const seqS = sequential.summary
  const parS = parallel.summary

  const date = new Date(completedAt).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const routeSpeedup = routeCalculation.parallelTimeMs > 0
    ? (routeCalculation.sequentialTimeMs / routeCalculation.parallelTimeMs).toFixed(2) + 'x'
    : 'N/A'

  const simSpeedup = parallel.durationMs > 0
    ? (sequential.durationMs / parallel.durationMs).toFixed(2) + 'x'
    : 'N/A'

  function row(label: string, seqVal: string, parVal: string): string {
    return `  ${label.padEnd(28)}${seqVal.padStart(12)}${parVal.padStart(12)}`
  }

  return [
    '═══════════════════════════════════════════════════════',
    '  SIMULADOR DE TRÁFICO URBANO',
    '  Reporte de Simulación — SECUENCIAL y PARALELO',
    '═══════════════════════════════════════════════════════',
    `  ID:      ${simulationId}`,
    `  Fecha:   ${date}`,
    `  Modos:   SECUENCIAL y PARALELO`,
    '',
    '─── COMPARACIÓN GENERAL ─────────────────────────────',
    `${'  Métrica'.padEnd(30)}${'SECUENCIAL'.padStart(12)}${'PARALELO'.padStart(12)}`,
    '  ─────────────────────────────────────────────────',
    row('Duración simulación',
      `${(sequential.durationMs / 1000).toFixed(1)}s`,
      `${(parallel.durationMs / 1000).toFixed(1)}s`),
    row('Speedup simulación', '1.00x', simSpeedup),
    row('Vehículos completados',
      `${seqS.totalCompleted}/${seqS.totalVehicles}`,
      `${parS.totalCompleted}/${parS.totalVehicles}`),
    row('Tiempo prom. viaje',
      `${(seqS.averageTravelTimeMs / 1000).toFixed(1)}s`,
      `${(parS.averageTravelTimeMs / 1000).toFixed(1)}s`),
    row('Espera promedio',
      `${(seqS.averageWaitTimeMs / 1000).toFixed(1)}s (${seqS.averageWaitTimePercent.toFixed(1)}%)`,
      `${(parS.averageWaitTimeMs / 1000).toFixed(1)}s (${parS.averageWaitTimePercent.toFixed(1)}%)`),
    '',
    '─── CÁLCULO DE RUTAS A* ─────────────────────────────',
    row('Rutas secuencial (ms)', `${routeCalculation.sequentialTimeMs}ms`, ''),
    row('Rutas paralelo (ms)', '', `${routeCalculation.parallelTimeMs}ms`),
    `  Speedup A*:${' '.repeat(18)}${routeSpeedup.padStart(12)}`,
    '',
    '─── PRIMER LUGAR ─────────────────────────────────────',
    row('Vehículo', seqS.firstVehicleId, parS.firstVehicleId),
    row('Tiempo de viaje',
      `${(seqS.firstVehicleTravelTimeMs / 1000).toFixed(1)}s`,
      `${(parS.firstVehicleTravelTimeMs / 1000).toFixed(1)}s`),
    '',
    '─── CONGESTIÓN ───────────────────────────────────────',
    row('Intersección pico', seqS.mostCongestedIntersectionId, parS.mostCongestedIntersectionId),
    row('Esperas pico',
      `${seqS.mostCongestedIntersectionWaits} esperas`,
      `${parS.mostCongestedIntersectionWaits} esperas`),
    '',
    `  Duración total (max ambos): ${(totalDurationMs / 1000).toFixed(1)}s`,
    '═══════════════════════════════════════════════════════',
  ].join('\n')
}

/**
 * Descarga un archivo en el navegador disparando un clic en un <a> temporal.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Descarga el CSV y el TXT simultáneamente. */
export function exportReport(results: SimulationStopResponse): void {
  const id = results.simulationId
  downloadFile(buildCsvReport(results), `reporte-simulacion-${id}.csv`, 'text/csv;charset=utf-8')
  downloadFile(buildTxtReport(results), `reporte-simulacion-${id}.txt`, 'text/plain;charset=utf-8')
}
