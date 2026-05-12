/** Preview del mapa vacío que actualiza en tiempo real al cambiar el grid size. */

interface MapPreviewProps {
  gridSize: number
}

export default function MapPreview({ gridSize }: MapPreviewProps) {
  const cellSize = Math.floor(280 / gridSize)

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-3 sticky top-8">
      <h3 className="text-text-secondary text-sm font-medium">Vista previa del mapa</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gap: 1,
        }}
        aria-label={`Vista previa del grid ${gridSize}×${gridSize}`}
      >
        {Array.from({ length: gridSize * gridSize }, (_, i) => {
          const col = i % gridSize
          const row = Math.floor(i / gridSize)
          const hasLight = col % 2 === 0 && row % 2 === 0
          return (
            <div
              key={i}
              style={{ width: cellSize, height: cellSize }}
              className={hasLight ? 'bg-traffic-green/30' : 'bg-street'}
            />
          )
        })}
      </div>
      <p className="text-text-muted text-xs">{gridSize}×{gridSize} — {Math.floor(gridSize / 2) ** 2} semáforos</p>
    </div>
  )
}
