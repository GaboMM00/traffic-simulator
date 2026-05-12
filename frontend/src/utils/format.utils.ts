/** Utilidades de formateo para la interfaz de usuario. */

/** Formatea milisegundos como MM:SS.mmm para el cronómetro */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

/** Formatea milisegundos a segundos con 1 decimal: "12.4s" */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/** Formatea un porcentaje con 1 decimal: "21.9%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** Calcula el speedup como ratio y lo formatea: "3.82x" */
export function formatSpeedup(seqMs: number, parMs: number): string {
  if (parMs === 0) return 'N/A'
  return `${(seqMs / parMs).toFixed(2)}x`
}

/** Formatea el ID de vehículo para mostrar: "V-007" → "V007" si necesario */
export function formatVehicleId(id: string): string {
  return id
}
