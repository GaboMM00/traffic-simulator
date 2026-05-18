/** Tarjetas para elegir entre modo AUTOMÁTICO y MANUAL de generación de vehículos. */

import type { VehicleMode } from '../../types/config.types'

interface VehicleModeSelectorProps {
  /** Modo actualmente seleccionado. */
  mode: VehicleMode
  /** Callback cuando el usuario elige un modo. */
  onSelect: (mode: VehicleMode) => void
  /** Si true, las tarjetas se renderizan deshabilitadas (durante "agregando vehículo"). */
  disabled?: boolean
}

interface OptionCardProps {
  icon: string
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

function OptionCard({ icon, title, description, selected, disabled, onClick }: OptionCardProps) {
  const baseCls =
    'flex-1 p-4 rounded-xl border-2 text-left transition-all cursor-pointer select-none'
  const stateCls = selected
    ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_var(--color-accent)]'
    : 'border-border bg-surface hover:border-accent/60 hover:bg-surface-hover'
  const disabledCls = disabled ? 'opacity-40 pointer-events-none' : ''

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseCls} ${stateCls} ${disabledCls}`}
      aria-pressed={selected}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-text-primary font-semibold mb-1">{title}</div>
      <div className="text-text-secondary text-xs leading-snug">{description}</div>
    </button>
  )
}

export default function VehicleModeSelector({ mode, onSelect, disabled }: VehicleModeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-text-primary font-semibold">🚗 Modo de vehículos</h2>
      <div className="flex gap-3">
        <OptionCard
          icon="🎲"
          title="Automático"
          description="Elige cuántos autos y el sistema los distribuye"
          selected={mode === 'AUTO'}
          disabled={disabled}
          onClick={() => onSelect('AUTO')}
        />
        <OptionCard
          icon="✏️"
          title="Manual"
          description="Tú defines cada auto: dónde sale y a dónde va"
          selected={mode === 'MANUAL'}
          disabled={disabled}
          onClick={() => onSelect('MANUAL')}
        />
      </div>
    </div>
  )
}
