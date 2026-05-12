/**
 * Fondo animado de la pantalla de bienvenida.
 * Simula un grid 12×12 con vehículos moviéndose en loop usando canvas 2D nativo.
 * No se conecta al backend: es una animación completamente independiente.
 * Los vehículos respetan el sistema Manhattan alternado del proyecto.
 */

import { useEffect, useRef } from 'react'

const GRID_SIZE = 12
const BG_COLOR     = '#0d1117'
const STREET_COLOR = '#21262d'
const VEHICLE_COLORS = ['#58a6ff', '#bc8cff', '#ff7b72', '#ffa657', '#3fb950', '#39d353']

interface AnimVehicle {
  col: number
  row: number
  dcol: number
  drow: number
  progress: number
  colorIdx: number
  speed: number
}

/** Calcula la dirección de salida desde (col, row) según el sistema Manhattan alternado. */
function nextDir(col: number, row: number): [number, number] {
  const canEast  = row % 2 === 0 && col < GRID_SIZE - 1
  const canWest  = row % 2 === 1 && col > 0
  const canSouth = col % 2 === 0 && row < GRID_SIZE - 1
  const canNorth = col % 2 === 1 && row > 0

  const opts: [number, number][] = []
  if (canEast)  opts.push([1, 0])
  if (canWest)  opts.push([-1, 0])
  if (canSouth) opts.push([0, 1])
  if (canNorth) opts.push([0, -1])

  if (opts.length === 0) return [row % 2 === 0 ? 1 : -1, 0]
  return opts[Math.floor(Math.random() * opts.length)]
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number

    function resize() {
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const cellSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) / GRID_SIZE)

    const vehicles: AnimVehicle[] = Array.from({ length: 15 }, (_, i) => {
      const col = Math.floor(Math.random() * GRID_SIZE)
      const row = Math.floor(Math.random() * GRID_SIZE)
      const [dc, dr] = nextDir(col, row)
      return { col, row, dcol: dc, drow: dr, progress: Math.random(), colorIdx: i % VEHICLE_COLORS.length, speed: 0.008 + Math.random() * 0.012 }
    })

    function draw() {
      if (!ctx || !canvas) return
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = STREET_COLOR
      ctx.lineWidth = cellSize * 0.3
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, GRID_SIZE * cellSize); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(GRID_SIZE * cellSize, i * cellSize); ctx.stroke()
      }

      const vw = cellSize * 0.45
      const vh = cellSize * 0.28
      for (const v of vehicles) {
        const x1 = v.col * cellSize + cellSize / 2
        const y1 = v.row * cellSize + cellSize / 2
        const x2 = (v.col + v.dcol) * cellSize + cellSize / 2
        const y2 = (v.row + v.drow) * cellSize + cellSize / 2
        const x  = x1 + (x2 - x1) * v.progress
        const y  = y1 + (y2 - y1) * v.progress
        const angle = Math.atan2(v.drow, v.dcol)
        const r = vh * 0.3

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillStyle = VEHICLE_COLORS[v.colorIdx]
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.moveTo(-vw / 2 + r, -vh / 2)
        ctx.lineTo(vw / 2 - r, -vh / 2)
        ctx.arcTo(vw / 2, -vh / 2, vw / 2, -vh / 2 + r, r)
        ctx.lineTo(vw / 2, vh / 2 - r)
        ctx.arcTo(vw / 2, vh / 2, vw / 2 - r, vh / 2, r)
        ctx.lineTo(-vw / 2 + r, vh / 2)
        ctx.arcTo(-vw / 2, vh / 2, -vw / 2, vh / 2 - r, r)
        ctx.lineTo(-vw / 2, -vh / 2 + r)
        ctx.arcTo(-vw / 2, -vh / 2, -vw / 2 + r, -vh / 2, r)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        v.progress += v.speed
        if (v.progress >= 1) {
          v.progress = 0
          v.col = Math.max(0, Math.min(GRID_SIZE - 1, v.col + v.dcol))
          v.row = Math.max(0, Math.min(GRID_SIZE - 1, v.row + v.drow))
          const [dc, dr] = nextDir(v.col, v.row)
          v.dcol = dc; v.drow = dr
        }
      }

      animFrame = requestAnimationFrame(draw)
    }

    animFrame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ filter: 'blur(8px)', opacity: 0.85 }}
      aria-hidden="true"
    />
  )
}
