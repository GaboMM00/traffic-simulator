/**
 * Servicio de generación de reportes PDF para el Simulador de Tráfico.
 * Construye un documento de 5 páginas usando jsPDF + jspdf-autotable + html2canvas.
 * No tiene dependencias de React: recibe los datos y las referencias DOM como parámetros.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import type { RefObject } from 'react'
import type { SimulationStopResponse } from '../types/simulation.types'
import type { SimulationConfig } from '../types/config.types'

// ─── Constantes de color (RGB) ────────────────────────────────────────────────
const C = {
  headerBg:   [13, 17, 23]    as [number, number, number],  // #0d1117
  headerText: [255, 255, 255] as [number, number, number],  // #ffffff
  rowEven:    [246, 248, 250] as [number, number, number],  // #f6f8fa
  rowOdd:     [255, 255, 255] as [number, number, number],  // #ffffff
  border:     [208, 215, 222] as [number, number, number],  // #d0d7de
  accent:     [88, 166, 255]  as [number, number, number],  // #58a6ff
  blue:       [121, 192, 255] as [number, number, number],  // #79c0ff (SEQ)
  text:       [28, 35, 51]    as [number, number, number],  // #1c2333
  muted:      [87, 96, 106]   as [number, number, number],  // #57606a
}

const PAGE_W    = 210
const PAGE_H    = 297
const MARGIN    = 20
const CONTENT_W = PAGE_W - MARGIN * 2

// ─── Tipo público ─────────────────────────────────────────────────────────────

/** Referencias DOM de las cuatro gráficas que se capturan con html2canvas. */
export interface ChartRefs {
  histogram:     RefObject<HTMLDivElement | null>
  timeline:      RefObject<HTMLDivElement | null>
  seqVsParallel: RefObject<HTMLDivElement | null>
  waitPie:       RefObject<HTMLDivElement | null>
}

// ─── Utilidades internas ──────────────────────────────────────────────────────

function addPageFooter(doc: jsPDF, page: number, total: number, date: string): void {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(
    `Simulador de Tráfico Urbano  |  ${date}  |  Página ${page} de ${total}`,
    PAGE_W / 2,
    PAGE_H - 8,
    { align: 'center' }
  )
}

function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...C.accent)
  doc.text(text, MARGIN, y)
  doc.setDrawColor(...C.accent)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_W, y + 2)
  return y + 12
}

function drawLabelValue(doc: jsPDF, label: string, value: string, y: number): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.text)
  doc.text(`${label}:`, MARGIN + 15, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  doc.text(value, MARGIN + 82, y)
}

function tableStyles() {
  return {
    headStyles: {
      fillColor:   C.headerBg,
      textColor:   C.headerText,
      fontStyle:   'bold'  as const,
      fontSize:    9,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: C.rowEven },
    bodyStyles: {
      fillColor:   C.rowOdd,
      textColor:   C.text,
      fontSize:    9,
      cellPadding: 3,
    },
    tableLineColor: C.border,
    tableLineWidth: 0.1,
    margin: { left: MARGIN, right: MARGIN },
  }
}

async function insertChartImage(
  doc: jsPDF,
  element: HTMLElement,
  y: number,
  maxH: number
): Promise<number> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#161b22',
  })
  const imgData     = canvas.toDataURL('image/png')
  const aspectRatio = canvas.width / canvas.height
  const imgW        = CONTENT_W
  const imgH        = Math.min(maxH, imgW / aspectRatio)
  doc.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH)
  return imgH
}

// ─── Constructores de página ──────────────────────────────────────────────────

/** Página 1 — Portada con datos de la simulación y comparativa breve. */
function buildPortada(
  doc: jsPDF,
  results: SimulationStopResponse,
  config: SimulationConfig
): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...C.text)
  doc.text('SIMULADOR DE TRÁFICO URBANO', PAGE_W / 2, 85, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(...C.muted)
  doc.text('Reporte de Simulación — Secuencial vs Paralelo', PAGE_W / 2, 97, { align: 'center' })

  doc.setDrawColor(...C.accent)
  doc.setLineWidth(0.8)
  doc.line(MARGIN + 30, 106, PAGE_W - MARGIN - 30, 106)

  const date = new Date(results.completedAt).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const parS = results.parallel.summary
  const seqS = results.sequential.summary

  const rows: [string, string][] = [
    ['ID de simulación',        results.simulationId],
    ['Fecha de ejecución',      date],
    ['Modos ejecutados',        'SECUENCIAL y PARALELO (simultáneos)'],
    ['Tamaño del grid',         `${config.gridSize} × ${config.gridSize}`],
    ['Vehículos totales',       `${parS.totalVehicles}`],
    ['Completados SEQ / PAR',   `${seqS.totalCompleted} / ${parS.totalCompleted}`],
    ['Duración total (máx)',    `${(results.totalDurationMs / 1000).toFixed(1)}s`],
  ]

  let y = 130
  for (const [label, value] of rows) {
    drawLabelValue(doc, label, value, y)
    y += 13
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C.muted)
  doc.text('Programación Paralela y Concurrente — 2024', PAGE_W / 2, PAGE_H - 22, { align: 'center' })
}

/**
 * Página 2 — Resumen comparativo SEQ vs PAR.
 * Tabla 1: métricas clave side-by-side (duración, tiempos, vehículos).
 * Tabla 2: cálculo de rutas A* con speedup.
 */
function buildResumen(doc: jsPDF, results: SimulationStopResponse): void {
  doc.addPage()
  const { sequential, parallel, routeCalculation, totalDurationMs } = results
  const seqS = sequential.summary
  const parS = parallel.summary

  const routeSpeedup = routeCalculation.parallelTimeMs > 0
    ? (routeCalculation.sequentialTimeMs / routeCalculation.parallelTimeMs).toFixed(2) + 'x'
    : 'N/A'
  const simSpeedup = parallel.durationMs > 0
    ? (sequential.durationMs / parallel.durationMs).toFixed(2) + 'x'
    : 'N/A'

  let y = drawSectionTitle(doc, 'COMPARACIÓN SECUENCIAL vs PARALELO', MARGIN)

  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['Métrica', 'SECUENCIAL', 'PARALELO']],
    body: [
      ['Duración simulación',
        `${(sequential.durationMs / 1000).toFixed(2)}s`,
        `${(parallel.durationMs / 1000).toFixed(2)}s`],
      ['Speedup simulación',        '1.00×',          simSpeedup],
      ['Vehículos completados',
        `${seqS.totalCompleted} / ${seqS.totalVehicles}`,
        `${parS.totalCompleted} / ${parS.totalVehicles}`],
      ['Tiempo promedio de viaje',
        `${(seqS.averageTravelTimeMs / 1000).toFixed(2)}s`,
        `${(parS.averageTravelTimeMs / 1000).toFixed(2)}s`],
      ['Tiempo promedio de espera',
        `${(seqS.averageWaitTimeMs / 1000).toFixed(2)}s (${seqS.averageWaitTimePercent.toFixed(1)}%)`,
        `${(parS.averageWaitTimeMs / 1000).toFixed(2)}s (${parS.averageWaitTimePercent.toFixed(1)}%)`],
      ['Primer lugar',              seqS.firstVehicleId,   parS.firstVehicleId],
      ['Tiempo primer lugar',
        `${(seqS.firstVehicleTravelTimeMs / 1000).toFixed(2)}s`,
        `${(parS.firstVehicleTravelTimeMs / 1000).toFixed(2)}s`],
      ['Intersección más congestionada',
        `${seqS.mostCongestedIntersectionId} (${seqS.mostCongestedIntersectionWaits} esp.)`,
        `${parS.mostCongestedIntersectionId} (${parS.mostCongestedIntersectionWaits} esp.)`],
      ['Duración total (máx ambos)', `${(totalDurationMs / 1000).toFixed(2)}s`, ''],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'right', textColor: C.muted },
      2: { halign: 'right', textColor: C.accent },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 18
  y = drawSectionTitle(doc, 'CÁLCULO DE RUTAS A* (benchmark)', y)

  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['Modo', 'Tiempo de cálculo', 'Speedup']],
    body: [
      ['Secuencial A*', `${routeCalculation.sequentialTimeMs} ms`, '1.00×'],
      ['Paralelo A* (ForkJoin)', `${routeCalculation.parallelTimeMs} ms`, routeSpeedup],
    ],
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold', textColor: C.accent },
    },
  })
}

/** Página 3 — Gráficas parte 1 (histograma + timeline). */
async function buildGraficas1(doc: jsPDF, refs: ChartRefs): Promise<void> {
  doc.addPage()
  let y = drawSectionTitle(doc, 'GRÁFICAS DE ANÁLISIS — PARTE 1', MARGIN)

  if (refs.histogram.current) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C.text)
    doc.text('Distribución comparativa de tiempos de viaje (SEQ vs PAR)', MARGIN, y + 5)
    y += 10
    const h = await insertChartImage(doc, refs.histogram.current, y, 100)
    y += h + 16
  }

  if (refs.timeline.current) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C.text)
    doc.text('Tiempo de llegada por posición (SEQ vs PAR)', MARGIN, y + 5)
    y += 10
    await insertChartImage(doc, refs.timeline.current, y, 100)
  }
}

/** Página 4 — Gráficas parte 2 (duración sim + pie de espera). */
async function buildGraficas2(doc: jsPDF, refs: ChartRefs): Promise<void> {
  doc.addPage()
  let y = drawSectionTitle(doc, 'GRÁFICAS DE ANÁLISIS — PARTE 2', MARGIN)

  if (refs.seqVsParallel.current) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C.text)
    doc.text('Duración de la simulación: Secuencial vs Paralelo', MARGIN, y + 5)
    y += 10
    const h = await insertChartImage(doc, refs.seqVsParallel.current, y, 100)
    y += h + 16
  }

  if (refs.waitPie.current) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...C.text)
    doc.text('Tiempo en movimiento vs espera en semáforos (SEQ y PAR)', MARGIN, y + 5)
    y += 10
    await insertChartImage(doc, refs.waitPie.current, y, 100)
  }
}

/**
 * Página 5 — Detalle por vehículo (modo PARALELO).
 * Ordenados por tiempo de viaje ascendente.
 */
function buildDetalle(doc: jsPDF, results: SimulationStopResponse): void {
  doc.addPage()
  let y = drawSectionTitle(doc, 'DETALLE POR VEHÍCULO — MODO PARALELO', MARGIN)

  const sorted = [...results.parallel.vehicles].sort((a, b) => a.travelTimeMs - b.travelTimeMs)

  autoTable(doc, {
    ...tableStyles(),
    startY: y,
    head: [['#', 'ID', 'Viaje (s)', 'Espera (s)', '% Espera', 'Ruta', 'OK']],
    body: sorted.map((v, i) => [
      String(i + 1),
      v.vehicleId,
      (v.travelTimeMs / 1000).toFixed(2),
      (v.waitTimeMs / 1000).toFixed(2),
      `${v.waitTimePercent.toFixed(1)}%`,
      String(v.routeLength),
      v.completed ? 'Sí' : 'No',
    ]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 18

  if (y < PAGE_H - 60) {
    y = drawSectionTitle(doc, 'DETALLE POR VEHÍCULO — MODO SECUENCIAL', y)
    const sortedSeq = [...results.sequential.vehicles].sort((a, b) => a.travelTimeMs - b.travelTimeMs)

    autoTable(doc, {
      ...tableStyles(),
      startY: y,
      head: [['#', 'ID', 'Viaje (s)', 'Espera (s)', '% Espera', 'Ruta', 'OK']],
      body: sortedSeq.map((v, i) => [
        String(i + 1),
        v.vehicleId,
        (v.travelTimeMs / 1000).toFixed(2),
        (v.waitTimeMs / 1000).toFixed(2),
        `${v.waitTimePercent.toFixed(1)}%`,
        String(v.routeLength),
        v.completed ? 'Sí' : 'No',
      ]),
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
      },
    })
  } else {
    // Si no hay espacio, agregar en una nueva página
    doc.addPage()
    const y2 = drawSectionTitle(doc, 'DETALLE POR VEHÍCULO — MODO SECUENCIAL', MARGIN)
    const sortedSeq = [...results.sequential.vehicles].sort((a, b) => a.travelTimeMs - b.travelTimeMs)
    autoTable(doc, {
      ...tableStyles(),
      startY: y2,
      head: [['#', 'ID', 'Viaje (s)', 'Espera (s)', '% Espera', 'Ruta', 'OK']],
      body: sortedSeq.map((v, i) => [
        String(i + 1),
        v.vehicleId,
        (v.travelTimeMs / 1000).toFixed(2),
        (v.waitTimeMs / 1000).toFixed(2),
        `${v.waitTimePercent.toFixed(1)}%`,
        String(v.routeLength),
        v.completed ? 'Sí' : 'No',
      ]),
    })
  }
}

// ─── Función principal exportada ──────────────────────────────────────────────

/**
 * Genera y descarga el reporte PDF completo de la simulación dual.
 *
 * Secuencia de construcción:
 *   1. Portada (ID, fecha, modos, grid, vehículos completados SEQ/PAR)
 *   2. Resumen comparativo (tabla SEQ vs PAR + tabla A* speedup)
 *   3. Gráficas parte 1 (histograma + timeline comparativo)
 *   4. Gráficas parte 2 (duración sim + pie de espera)
 *   5. Detalle por vehículo (PAR + SEQ)
 *   6. Pie de página en todas las páginas
 *   7. Descarga del archivo como reporte-{simulationId}.pdf
 */
export async function generatePdfReport(
  results: SimulationStopResponse,
  config: SimulationConfig,
  refs: ChartRefs
): Promise<void> {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const date = new Date(results.completedAt).toLocaleDateString('es-MX')

  buildPortada(doc, results, config)
  buildResumen(doc, results)
  await buildGraficas1(doc, refs)
  await buildGraficas2(doc, refs)
  buildDetalle(doc, results)

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addPageFooter(doc, i, totalPages, date)
  }

  doc.save(`reporte-${results.simulationId}.pdf`)
}
