/**
 * Slider con valores discretos no lineales.
 * El control HTML interno opera sobre índices (0..steps.length-1) y mapea al valor real.
 * Útil para rangos amplios donde se necesita más precisión en los valores pequeños
 * (ej. tamaño de grid 8-100 con pasos 8,10,12,15,20,25,30,40,50,60,70,80,90,100).
 */

import { nearestStepIndex } from '../../constants/simulation.constants'

interface SteppedSliderProps {
  /** Valores discretos (no necesariamente equidistantes) que puede tomar el slider. */
  steps: readonly number[]
  /** Valor actual; se mapea al paso más cercano. */
  value: number
  /** Callback con el nuevo valor (paso seleccionado). */
  onChange: (value: number) => void
  label?: string
  /** Función opcional para formatear el valor que se muestra en el badge. */
  formatValue?: (value: number) => string
  disabled?: boolean
}

export default function SteppedSlider({
  steps, value, onChange, label, formatValue, disabled,
}: SteppedSliderProps) {
  const currentIndex = nearestStepIndex(value, steps)
  const currentValue = steps[currentIndex]

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary font-medium">
            {formatValue ? formatValue(currentValue) : currentValue}
          </span>
        </div>
      )}
      <input
        type="range"
        min={0}
        max={steps.length - 1}
        step={1}
        value={currentIndex}
        onChange={(e) => onChange(steps[Number(e.target.value)])}
        disabled={disabled}
        className="w-full accent-accent disabled:opacity-50 cursor-pointer"
        aria-label={label}
        aria-valuemin={steps[0]}
        aria-valuemax={steps[steps.length - 1]}
        aria-valuenow={currentValue}
      />
      {/* Marcas tenues debajo del slider para indicar los pasos disponibles */}
      <div className="flex justify-between mt-0.5 text-[10px] text-text-muted">
        <span>{formatValue ? formatValue(steps[0]) : steps[0]}</span>
        <span>{formatValue ? formatValue(steps[steps.length - 1]) : steps[steps.length - 1]}</span>
      </div>
    </div>
  )
}
