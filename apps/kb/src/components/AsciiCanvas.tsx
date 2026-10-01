import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import {
  applyEnergy,
  BLOCK_GLYPHS,
  buildMask,
  createRng,
  decayEnergy,
  GLYPH_PITCH,
  glyphRun,
  latticeSize,
  snapRect,
  type Lattice,
  type PixelRect,
} from '../lib/ascii/field'
import { createGrainPattern, punchGrain } from '../lib/ascii/grain'
import { ColorProbes, readProbeColor } from './ColorProbes'

export interface CanvasSize {
  width: number
  height: number
}

export interface FieldParams {
  lattice: Lattice
  seed: number
  mask: Uint8Array
}

export interface AsciiCanvasProps {
  getLattice: (size: CanvasSize) => Lattice
  getGridLattice?: (size: CanvasSize) => Lattice
  getField: (params: FieldParams) => Float32Array
  keepOutRefs?: RefObject<HTMLElement | null>[]
  keepOutMargin?: number
  words?: string[]
  wakeRadius?: number
  hasIdleShimmer?: boolean
  isInteractive?: boolean
  decay?: number
  isActive?: boolean
  className?: string
}

interface RunParams {
  index: number
  quantized: number
  capacity: number
}

interface IngestedWord {
  word: string
  startedAt: number
}

interface Palette {
  background: string
  grid: string
  muted: string
  hot: string
}

const FONT = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
const CELL_PADDING = 8
const DECAY = 0.92
const POINTER_ENERGY = 0.35
const IDLE_ENERGY = 0.9
const IDLE_INTERVAL_MS = 600
const IDLE_BURST = 1
const HOT_THRESHOLD = 0.15
const DENSITY_STEPS = 8
const LETTER_STEP_MS = 90
const LETTER_SCRAMBLE_MS = 240
const SCRAMBLE_STEP_MS = 70

const PROBES = {
  grid: 'text-border-muted',
  muted: 'text-foreground-muted',
  hot: 'text-foreground-lighter',
  background: 'text-background',
} as const

const isTransparent = (color: string) => color === 'transparent' || color.endsWith(', 0)')

const readPalette = (probeRoot: HTMLElement, host: HTMLElement): Palette => {
  const hostBackground = getComputedStyle(host).backgroundColor
  const read = (role: keyof typeof PROBES) => readProbeColor(probeRoot, role)
  return {
    background: isTransparent(hostBackground) ? read('background') : hostBackground,
    grid: read('grid'),
    muted: read('muted'),
    hot: read('hot'),
  }
}

const relativeRect = (element: HTMLElement, origin: DOMRect): PixelRect => {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left - origin.left,
    top: rect.top - origin.top,
    right: rect.right - origin.left,
    bottom: rect.bottom - origin.top,
  }
}

export const AsciiCanvas = ({
  getLattice,
  getGridLattice,
  getField,
  keepOutRefs = [],
  keepOutMargin = 1,
  words = [],
  wakeRadius = 140,
  hasIdleShimmer = false,
  isInteractive = true,
  decay = DECAY,
  isActive = true,
  className,
}: AsciiCanvasProps) => {
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    const host = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !host || !ctx) return

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seed = Math.floor(Math.random() * 2 ** 31)
    const probeRoot = canvas.nextElementSibling
    if (!(probeRoot instanceof HTMLElement)) return

    const grain = createGrainPattern(ctx)
    let palette = readPalette(probeRoot, host)
    let lattice: Lattice = { xs: [0], ys: [0] }
    let grid: Lattice = lattice
    let base: Float32Array = new Float32Array(0)
    let energy: Float32Array = new Float32Array(0)
    let mask: Uint8Array = new Uint8Array(0)
    let cutouts: PixelRect[] = []
    let measuredKey = ''
    let isDisposed = false
    const runs = new Map<number, string>()
    const ingested = new Map<number, IngestedWord>()
    let isVisible = false
    let frame = 0
    let idleTimer = 0
    const observed = new Set<HTMLElement>()

    const isRunning = () =>
      isVisible && document.visibilityState === 'visible' && canvas.dataset.active === 'true'

    const capacityAt = (c: number) =>
      Math.max(1, Math.floor((lattice.xs[c + 1] - lattice.xs[c] - CELL_PADDING * 2) / GLYPH_PITCH))

    const getRun = ({ index, quantized, capacity }: RunParams) => {
      const runKey = index * (DENSITY_STEPS + 1) + quantized
      const cached = runs.get(runKey)
      if (cached !== undefined) return cached
      const run = glyphRun({
        density: quantized / DENSITY_STEPS,
        capacity,
        rand: createRng(seed + index * 97 + quantized),
      })
      runs.set(runKey, run)
      return run
    }

    const draw = () => {
      const { cols, rows } = latticeSize(lattice)
      const { xs, ys } = lattice
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = palette.grid
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < grid.xs.length - 1; i++) {
        ctx.moveTo(Math.round(grid.xs[i]) + 0.5, 0)
        ctx.lineTo(Math.round(grid.xs[i]) + 0.5, height)
      }
      for (let i = 1; i < grid.ys.length - 1; i++) {
        ctx.moveTo(0, Math.round(grid.ys[i]) + 0.5)
        ctx.lineTo(width, Math.round(grid.ys[i]) + 0.5)
      }
      ctx.stroke()
      if (grain) {
        punchGrain({ ctx, pattern: grain, rect: { left: 0, top: 0, right: width, bottom: height } })
      }

      ctx.fillStyle = palette.background
      for (const rect of cutouts) {
        const cell = snapRect({ lattice: grid, rect, margin: 0 })
        if (!cell) continue
        const left = Math.round(cell.left) + 1
        const top = Math.round(cell.top) + 1
        ctx.fillRect(left, top, Math.round(cell.right) - left, Math.round(cell.bottom) - top)
      }

      ctx.font = FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const now = performance.now()
      for (let r = 0; r < rows; r++) {
        const cy = (ys[r] + ys[r + 1]) / 2
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c
          if (mask[index]) continue
          const density = Math.min(1, base[index] + energy[index])
          if (density <= 0) continue
          const cellWidth = xs[c + 1] - xs[c]
          const capacity = capacityAt(c)
          const ingest = energy[index] > HOT_THRESHOLD ? ingested.get(index) : undefined
          if (ingest) {
            const wordStart = xs[c] + CELL_PADDING + GLYPH_PITCH / 2
            ctx.fillStyle = palette.hot
            const elapsed = now - ingest.startedAt
            for (let i = 0; i < ingest.word.length; i++) {
              const since = elapsed - i * LETTER_STEP_MS
              if (since < 0) break
              const char =
                since < LETTER_SCRAMBLE_MS
                  ? BLOCK_GLYPHS[Math.floor(since / SCRAMBLE_STEP_MS) % BLOCK_GLYPHS.length]
                  : ingest.word[i]
              ctx.fillText(char, wordStart + i * GLYPH_PITCH, cy)
            }
            continue
          }
          const run = getRun({ index, quantized: Math.round(density * DENSITY_STEPS), capacity })
          const runStart =
            capacity === 1 ? xs[c] + cellWidth / 2 : xs[c] + CELL_PADDING + GLYPH_PITCH / 2
          ctx.fillStyle = energy[index] > HOT_THRESHOLD ? palette.hot : palette.muted
          for (let i = 0; i < run.length; i++) ctx.fillText(run[i], runStart + i * GLYPH_PITCH, cy)
        }
      }
    }

    const tick = () => {
      frame = 0
      draw()
      const isHot = decayEnergy({ energy, factor: decay })
      if (isHot && isRunning()) frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!frame && isRunning() && !isReducedMotion) frame = requestAnimationFrame(tick)
    }

    const measure = () => {
      if (isDisposed) return
      const width = host.clientWidth
      const height = host.clientHeight
      const dpr = window.devicePixelRatio || 1
      const origin = canvas.getBoundingClientRect()
      const keepOuts = keepOutRefs.flatMap((ref) => (ref.current ? [ref.current] : []))
      for (const element of keepOuts) {
        if (observed.has(element)) continue
        observed.add(element)
        resizeObserver.observe(element)
      }
      const nextCutouts = keepOuts.map((element) => relativeRect(element, origin))
      const key = JSON.stringify([width, height, dpr, nextCutouts])
      if (key === measuredKey) return
      measuredKey = key

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      lattice = getLattice({ width, height })
      grid = getGridLattice?.({ width, height }) ?? lattice
      cutouts = nextCutouts
      runs.clear()
      ingested.clear()
      const safeAreas = cutouts.flatMap(
        (rect) => snapRect({ lattice: grid, rect, margin: keepOutMargin }) ?? []
      )
      mask = buildMask({ lattice, rects: safeAreas, margin: 0 })
      base = getField({ lattice, seed, mask })
      energy = new Float32Array(base.length)
      draw()
    }

    const pointAt = (event: PointerEvent) => {
      if (isReducedMotion) return
      const origin = canvas.getBoundingClientRect()
      applyEnergy({
        lattice,
        energy,
        x: event.clientX - origin.left,
        y: event.clientY - origin.top,
        radius: wakeRadius,
        amount: POINTER_ENERGY,
      })
      wake()
    }

    const shimmer = () => {
      idleTimer = window.setTimeout(shimmer, IDLE_INTERVAL_MS)
      if (!isRunning() || energy.length === 0) return
      const { cols } = latticeSize(lattice)
      for (let i = 0; i < IDLE_BURST; i++) {
        const index = Math.floor(Math.random() * energy.length)
        if (mask[index]) continue
        energy[index] = IDLE_ENERGY
        const capacity = capacityAt(index % cols)
        const fitting = words.filter((word) => word.length <= capacity)
        if (fitting.length > 0) {
          const word = fitting[Math.floor(Math.random() * fitting.length)]
          ingested.set(index, { word, startedAt: performance.now() })
        } else {
          ingested.delete(index)
        }
      }
      wake()
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(host)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      wake()
    })
    intersectionObserver.observe(canvas)

    const themeObserver = new MutationObserver(() => {
      palette = readPalette(probeRoot, host)
      draw()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const activeObserver = new MutationObserver(wake)
    activeObserver.observe(canvas, { attributes: true, attributeFilter: ['data-active'] })

    if (isInteractive) {
      host.addEventListener('pointermove', pointAt)
      host.addEventListener('pointerdown', pointAt)
    }
    document.addEventListener('visibilitychange', wake)
    document.fonts?.ready.then(measure)
    if (hasIdleShimmer && !isReducedMotion) shimmer()

    return () => {
      isDisposed = true
      cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      activeObserver.disconnect()
      host.removeEventListener('pointermove', pointAt)
      host.removeEventListener('pointerdown', pointAt)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

  return (
    <>
      <canvas
        ref={setupCanvas}
        aria-hidden
        data-active={isActive}
        className={cn('pointer-events-none absolute inset-0 size-full', className)}
      />
      <ColorProbes probes={PROBES} />
    </>
  )
}
