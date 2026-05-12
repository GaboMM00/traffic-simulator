/** Tests para las utilidades de exportación de reportes CSV y TXT. */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildCsvReport, buildTxtReport, downloadFile } from './export.utils'
import type { SimulationStopResponse } from '../types/simulation.types'

const fakeSummary = {
  firstVehicleId: 'V-001',
  firstVehicleTravelTimeMs: 12400,
  averageTravelTimeMs: 15550,
  averageWaitTimeMs: 3650,
  averageWaitTimePercent: 23.85,
  totalCompleted: 2,
  totalVehicles: 3,
  mostCongestedIntersectionId: 'I-4-6',
  mostCongestedIntersectionWaits: 23,
}

const fakeVehicles = [
  { vehicleId: 'V-001', arrivalOrder: 1, travelTimeMs: 12400, waitTimeMs: 3200, waitTimePercent: 25.8, routeLength: 14, completed: true },
  { vehicleId: 'V-002', arrivalOrder: 2, travelTimeMs: 18700, waitTimeMs: 4100, waitTimePercent: 21.9, routeLength: 10, completed: true },
  { vehicleId: 'V-003', arrivalOrder: 0, travelTimeMs: 0,     waitTimeMs: 0,    waitTimePercent: 0,    routeLength: 0,  completed: false },
]

const fakeResults: SimulationStopResponse = {
  simulationId: 'SIM-001',
  completedAt: '2026-05-03T14:32:00',
  totalDurationMs: 45200,
  routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 89, speedup: 3.82 },
  sequential: { durationMs: 24000, vehicles: fakeVehicles, summary: fakeSummary },
  parallel:   { durationMs: 21200, vehicles: fakeVehicles, summary: fakeSummary },
}

describe('buildCsvReport', () => {
  it('incluye el ID de simulación en el encabezado', () => {
    const csv = buildCsvReport(fakeResults)
    expect(csv).toContain('SIM-001')
  })

  it('incluye el modo SECUENCIAL y PARALELO como filas de datos', () => {
    const csv = buildCsvReport(fakeResults)
    expect(csv).toContain('SECUENCIAL')
    expect(csv).toContain('PARALELO')
  })

  it('incluye el speedup de rutas calculado correctamente (340/89)', () => {
    const csv = buildCsvReport(fakeResults)
    const speedup = (340 / 89).toFixed(2)
    expect(csv).toContain(speedup)
  })

  it('incluye la sección de vehículos con cabecera y filas', () => {
    const csv = buildCsvReport(fakeResults)
    expect(csv).toContain('vehicleId,arrivalOrder')
    expect(csv).toContain('V-001')
    expect(csv).toContain('V-002')
    expect(csv).toContain('V-003')
  })

  it('incluye las secciones de vehículos para ambos modos', () => {
    const csv = buildCsvReport(fakeResults)
    expect(csv).toContain('MODO SECUENCIAL')
    expect(csv).toContain('MODO PARALELO')
  })

  it('speedup es N/A cuando parallelTimeMs=0', () => {
    const results = {
      ...fakeResults,
      routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 0, speedup: null },
    }
    const csv = buildCsvReport(results)
    expect(csv).toContain('N/A')
  })
})

describe('buildTxtReport', () => {
  it('contiene el encabezado del simulador', () => {
    const txt = buildTxtReport(fakeResults)
    expect(txt).toContain('SIMULADOR DE TRÁFICO URBANO')
  })

  it('contiene el ID de simulación', () => {
    const txt = buildTxtReport(fakeResults)
    expect(txt).toContain('SIM-001')
  })

  it('contiene el speedup de rutas formateado con x', () => {
    const txt = buildTxtReport(fakeResults)
    const speedup = (340 / 89).toFixed(2)
    expect(txt).toContain(speedup + 'x')
  })

  it('contiene el vehículo líder y su tiempo en segundos', () => {
    const txt = buildTxtReport(fakeResults)
    expect(txt).toContain('V-001')
    expect(txt).toContain('12.4s')
  })

  it('contiene la intersección más congestionada', () => {
    const txt = buildTxtReport(fakeResults)
    expect(txt).toContain('I-4-6')
    expect(txt).toContain('23 esperas')
  })

  it('muestra N/A cuando parallelTimeMs=0', () => {
    const results = {
      ...fakeResults,
      routeCalculation: { sequentialTimeMs: 340, parallelTimeMs: 0, speedup: null },
    }
    const txt = buildTxtReport(results)
    expect(txt).toContain('N/A')
  })

  it('menciona ambos modos de ejecución', () => {
    const txt = buildTxtReport(fakeResults)
    expect(txt).toContain('SECUENCIAL')
    expect(txt).toContain('PARALELO')
  })

  it('incluye tabla comparativa con ambas duraciones', () => {
    const txt = buildTxtReport(fakeResults)
    // sequential.durationMs=24000 → 24.0s, parallel.durationMs=21200 → 21.2s
    expect(txt).toContain('24.0s')
    expect(txt).toContain('21.2s')
  })
})

describe('downloadFile', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let createElementSpy: ReturnType<typeof vi.spyOn>

  const fakeAnchor = {
    href: '',
    download: '',
    click: vi.fn(),
  }

  beforeEach(() => {
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => fakeAnchor as unknown as Node)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => fakeAnchor as unknown as Node)
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(fakeAnchor as unknown as HTMLElement)
    fakeAnchor.click = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('crea un Blob y llama a createObjectURL', () => {
    downloadFile('contenido', 'test.txt', 'text/plain')
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
  })

  it('asigna el href, download y dispara clic en el anchor', () => {
    downloadFile('datos', 'archivo.csv', 'text/csv')
    expect(fakeAnchor.href).toBe('blob:fake-url')
    expect(fakeAnchor.download).toBe('archivo.csv')
    expect(fakeAnchor.click).toHaveBeenCalledOnce()
  })

  it('añade y elimina el anchor del DOM', () => {
    downloadFile('x', 'x.txt', 'text/plain')
    expect(appendChildSpy).toHaveBeenCalledOnce()
    expect(removeChildSpy).toHaveBeenCalledOnce()
  })

  it('revoca la URL de objeto después de descargar', () => {
    downloadFile('x', 'x.txt', 'text/plain')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })

  it('crea el elemento a', () => {
    downloadFile('x', 'x.txt', 'text/plain')
    expect(createElementSpy).toHaveBeenCalledWith('a')
  })
})
