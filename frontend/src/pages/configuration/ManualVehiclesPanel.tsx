/** Panel del modo MANUAL: lista de vehículos agregados, contador y botón "Agregar vehículo". */

import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import type { ManualVehicle } from '../../types/config.types'

/** Estado de la interacción de agregar vehículo (compartido con el mapa interactivo). */
export type AddingStage = 'idle' | 'awaiting-origin' | 'awaiting-destination'

interface ManualVehiclesPanelProps {
  vehicles: ManualVehicle[]
  /** Máximo de vehículos permitidos según el grid. */
  maxVehicles: number
  /** Estado de la interacción "agregar vehículo". */
  stage: AddingStage
  /** Llamado al presionar "+ Agregar vehículo". */
  onStartAdding: () => void
  /** Llamado al presionar "Cancelar" durante el flujo de agregar. */
  onCancelAdding: () => void
  /** Llamado al presionar la × de un vehículo de la lista. */
  onRemove: (id: string) => void
}

const INSTRUCTIONS: Record<AddingStage, string | null> = {
  'idle': null,
  'awaiting-origin':      'Paso 1/2 — Clic en la intersección de ORIGEN 🟢 (debe ser del borde)',
  'awaiting-destination': 'Paso 2/2 — Clic en la intersección de DESTINO 🔴',
}

export default function ManualVehiclesPanel({
  vehicles, maxVehicles, stage, onStartAdding, onCancelAdding, onRemove,
}: ManualVehiclesPanelProps) {
  const isAdding = stage !== 'idle'
  const reachedMax = vehicles.length >= maxVehicles
  const minLabel = vehicles.length < 2
    ? `Mínimo 2 para iniciar`
    : reachedMax
      ? `Máximo alcanzado`
      : `${vehicles.length}/${maxVehicles} (puedes agregar ${maxVehicles - vehicles.length} más)`

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-text-primary font-semibold">✏️ Vehículos manuales</h2>
          <p className="text-text-secondary text-xs mt-0.5">
            Vehículos agregados: <span className="text-text-primary font-medium">{vehicles.length}</span>
            {' — '}{minLabel}
          </p>
        </div>
      </div>

      {/* Instrucción durante el flujo de agregar */}
      {isAdding && INSTRUCTIONS[stage] && (
        <div className="mb-3 p-2 rounded-lg bg-accent/15 border border-accent/40 text-xs text-text-primary text-center">
          {INSTRUCTIONS[stage]}
        </div>
      )}

      {/* Botón principal */}
      {!isAdding ? (
        <Button
          variant="primary"
          size="md"
          onClick={onStartAdding}
          disabled={reachedMax}
          className="w-full"
          aria-label="Agregar vehículo manual"
        >
          + Agregar vehículo
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="md"
          onClick={onCancelAdding}
          className="w-full"
          aria-label="Cancelar selección"
        >
          Cancelar
        </Button>
      )}

      {/* Lista de vehículos agregados */}
      <div className="mt-4 max-h-56 overflow-y-auto flex flex-col gap-1">
        {vehicles.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">
            Aún no has agregado vehículos.
          </p>
        )}
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-surface-hover border border-border text-xs"
          >
            <span className="text-text-primary font-medium shrink-0">{v.id}</span>
            <span className="text-text-secondary flex-1 truncate">
              🟢 ({v.originCol},{v.originRow}) → 🔴 ({v.destCol},{v.destRow})
            </span>
            <button
              type="button"
              onClick={() => onRemove(v.id)}
              className="text-text-muted hover:text-danger transition-colors px-1"
              aria-label={`Eliminar ${v.id}`}
              disabled={isAdding}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {reachedMax && !isAdding && (
        <p className="mt-2 text-[11px] text-yellow-500 text-center">
          Alcanzaste el máximo de vehículos para este grid.
        </p>
      )}
    </Card>
  )
}
