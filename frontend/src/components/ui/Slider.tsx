/** Slider de rango estilizado para el tema oscuro. */

interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  formatValue?: (value: number) => string
  disabled?: boolean
}

export default function Slider({ min, max, step = 1, value, onChange, label, formatValue, disabled }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary font-medium">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-accent disabled:opacity-50 cursor-pointer"
        aria-label={label}
      />
    </div>
  )
}
