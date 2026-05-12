/** Paleta de colores oficial del simulador. Usar estas constantes en todos los componentes. */

export const COLORS = {
  background:    '#0d1117',
  surface:       '#161b22',
  surfaceHover:  '#1c2333',
  border:        '#30363d',

  street:        '#21262d',
  block:         '#161b22',
  streetLabel:   '#8b949e',

  trafficGreen:  '#3fb950',
  trafficYellow: '#d29922',
  trafficRed:    '#f85149',

  vehicleColors: [
    '#58a6ff', '#bc8cff', '#ff7b72',
    '#ffa657', '#3fb950', '#39d353',
    '#f78166', '#79c0ff', '#d2a8ff',
    '#56d364',
  ] as const,

  accent:        '#58a6ff',
  accentHover:   '#79c0ff',
  textPrimary:   '#e6edf3',
  textSecondary: '#8b949e',
  textMuted:     '#484f58',

  success:       '#3fb950',
  warning:       '#d29922',
  danger:        '#f85149',
  info:          '#58a6ff',
  gold:          '#f0c060',
} as const
