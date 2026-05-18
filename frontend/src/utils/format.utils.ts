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

/**
 * Formatea un tiempo de cálculo de rutas con la unidad apropiada según magnitud.
 * Si los milisegundos son ≥1 → "Xms"; si son 0 pero hay nanosegundos → "X.X µs";
 * si todo es 0 → "0ms" (caso degenerado).
 *
 * @param ms milisegundos reportados por el backend (puede ser 0 en grids pequeños)
 * @param ns nanosegundos (opcional). Si se pasa y ms==0 se reporta en µs.
 */
export function formatRouteTime(ms: number, ns?: number): string {
  if (ms >= 1) return `${ms}ms`
  if (ns && ns > 0) {
    const us = ns / 1_000
    return us >= 100 ? `${us.toFixed(0)}µs` : `${us.toFixed(1)}µs`
  }
  return `${ms}ms`
}

/**
 * Calcula el speedup priorizando nanosegundos cuando estén disponibles (precisión sub-ms).
 * Si los Ns son 0 o ausentes, cae a milisegundos. Si ambos son 0, retorna "N/A".
 */
export function formatRouteSpeedup(
  seqMs: number, parMs: number, seqNs?: number, parNs?: number,
): string {
  if (seqNs && parNs && parNs > 0) return `${(seqNs / parNs).toFixed(2)}x`
  if (parMs > 0) return `${(seqMs / parMs).toFixed(2)}x`
  return 'N/A'
}

/** Formatea el ID de vehículo para mostrar: "V-007" → "V007" si necesario */
export function formatVehicleId(id: string): string {
  return id
}
