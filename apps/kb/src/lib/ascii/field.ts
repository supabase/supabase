export interface Lattice {
  xs: number[]
  ys: number[]
}

export interface PixelRect {
  left: number
  top: number
  right: number
  bottom: number
}

interface CellRange {
  c0: number
  c1: number
  r0: number
  r1: number
}

interface CellRangeParams {
  lattice: Lattice
  rect: PixelRect
  margin: number
}

interface BuildMaskParams {
  lattice: Lattice
  rects: PixelRect[]
  margin?: number
}

interface AlignedEdgesParams {
  size: number
  start: number
  end: number
  target: number
}

interface GlyphRunParams {
  density: number
  capacity: number
  rand: () => number
}

interface ApplyEnergyParams {
  lattice: Lattice
  energy: Float32Array
  x: number
  y: number
  radius: number
  amount: number
}

interface HeroFieldParams {
  lattice: Lattice
  seed: number
}

export const RAMP = [' ', '·', '░', '▒', '▓'] as const
export const BLOCK_GLYPHS = ['▓', '▒', '░'] as const

export const CELL_WIDTH = 120
export const CELL_HEIGHT = 26
export const GLYPH_PITCH = 12

const ENERGY_EPSILON = 0.01
const GLYPH_JITTER = 0.3
const MIN_COLUMN = 60

export const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    const mixed = Math.imul(state ^ (state >>> 15), state | 1)
    const remixed = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61))
    return ((remixed ^ (remixed >>> 14)) >>> 0) / 4294967296
  }
}

export const uniformEdges = ({ size, step }: { size: number; step: number }): number[] =>
  Array.from({ length: Math.ceil(Math.max(0, size) / step) + 1 }, (_, i) => i * step)

const roundEdge = (value: number) => Math.round(value * 100) / 100

export const alignedEdges = ({ size, start, end, target }: AlignedEdgesParams): number[] => {
  const span = end - start
  if (size <= 0 || span <= 0) return uniformEdges({ size, step: target })
  const count = Math.max(1, Math.round(span / target))
  const step = span / count
  const inner = Array.from({ length: count + 1 }, (_, i) => roundEdge(start + i * step))

  if (inner[0] < MIN_COLUMN) inner.shift()
  if (size - inner[inner.length - 1] < MIN_COLUMN) inner.pop()
  return [0, ...inner, size]
}

export const fitEdges = ({ size, target }: { size: number; target: number }): number[] => {
  const count = size > 0 ? Math.max(1, Math.round(size / target)) : 0
  return Array.from({ length: count + 1 }, (_, i) => roundEdge((i * size) / count || 0))
}

export const splitEdges = ({ edges, target }: { edges: number[]; target: number }): number[] => {
  const slots = [edges[0] ?? 0]
  for (let i = 0; i < edges.length - 1; i++) {
    const width = edges[i + 1] - edges[i]
    const count = Math.max(1, Math.floor(width / target))
    for (let k = 1; k <= count; k++) slots.push(roundEdge(edges[i] + (k * width) / count))
  }
  return slots
}

export const latticeSize = ({ xs, ys }: Lattice) => ({
  cols: Math.max(0, xs.length - 1),
  rows: Math.max(0, ys.length - 1),
})

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const firstIndexAtOrBefore = (edges: number[], value: number) => {
  let index = 0
  while (index < edges.length - 2 && edges[index + 1] <= value) index++
  return index
}

const lastIndexAtOrAfter = (edges: number[], value: number) => {
  let index = edges.length - 2
  while (index > 0 && edges[index] >= value) index--
  return index
}

export const cellRange = ({ lattice, rect, margin }: CellRangeParams): CellRange | null => {
  const { xs, ys } = lattice
  const { cols, rows } = latticeSize(lattice)
  if (cols === 0 || rows === 0) return null
  if (rect.right <= rect.left || rect.bottom <= rect.top) return null
  if (
    rect.right <= xs[0] ||
    rect.left >= xs[cols] ||
    rect.bottom <= ys[0] ||
    rect.top >= ys[rows]
  ) {
    return null
  }

  return {
    c0: clamp(firstIndexAtOrBefore(xs, rect.left) - margin, 0, cols - 1),
    c1: clamp(lastIndexAtOrAfter(xs, rect.right) + margin, 0, cols - 1),
    r0: clamp(firstIndexAtOrBefore(ys, rect.top) - margin, 0, rows - 1),
    r1: clamp(lastIndexAtOrAfter(ys, rect.bottom) + margin, 0, rows - 1),
  }
}

export const snapRect = ({ lattice, rect, margin }: CellRangeParams): PixelRect | null => {
  const range = cellRange({ lattice, rect, margin })
  if (!range) return null
  return {
    left: lattice.xs[range.c0],
    top: lattice.ys[range.r0],
    right: lattice.xs[range.c1 + 1],
    bottom: lattice.ys[range.r1 + 1],
  }
}

export const buildMask = ({ lattice, rects, margin = 1 }: BuildMaskParams): Uint8Array => {
  const { cols, rows } = latticeSize(lattice)
  const mask = new Uint8Array(cols * rows)
  for (const rect of rects) {
    const range = cellRange({ lattice, rect, margin })
    if (!range) continue
    for (let r = range.r0; r <= range.r1; r++) {
      for (let c = range.c0; c <= range.c1; c++) mask[r * cols + c] = 1
    }
  }
  return mask
}

const glyphFor = (density: number): string =>
  RAMP[clamp(Math.ceil(density * (RAMP.length - 1)), 0, RAMP.length - 1)]

export const glyphRun = ({ density, capacity, rand }: GlyphRunParams): string => {
  if (density <= 0 || capacity <= 0) return ''
  const length = clamp(Math.round(capacity * density), 1, capacity)
  return Array.from({ length }, () =>
    glyphFor(clamp(density + (rand() - 0.5) * GLYPH_JITTER, ENERGY_EPSILON, 1))
  ).join('')
}

export const applyEnergy = ({ lattice, energy, x, y, radius, amount }: ApplyEnergyParams) => {
  const { xs, ys } = lattice
  const { cols, rows } = latticeSize(lattice)
  for (let r = 0; r < rows; r++) {
    const cy = (ys[r] + ys[r + 1]) / 2
    if (Math.abs(cy - y) >= radius) continue
    for (let c = 0; c < cols; c++) {
      const cx = (xs[c] + xs[c + 1]) / 2
      const falloff = 1 - Math.hypot(cx - x, cy - y) / radius
      if (falloff <= 0) continue
      const index = r * cols + c
      energy[index] = Math.min(1, energy[index] + amount * falloff)
    }
  }
}

export const decayEnergy = ({ energy, factor }: { energy: Float32Array; factor: number }) => {
  let isHot = false
  for (let i = 0; i < energy.length; i++) {
    if (energy[i] === 0) continue
    energy[i] = energy[i] * factor < ENERGY_EPSILON ? 0 : energy[i] * factor
    if (energy[i] > 0) isHot = true
  }
  return isHot
}

export const heroField = ({ lattice, seed }: HeroFieldParams): Float32Array => {
  const { cols, rows } = latticeSize(lattice)
  const rand = createRng(seed)
  const field = new Float32Array(cols * rows)
  for (let c = 0; c < cols; c++) {
    const level = rand()
    const fillChance = (0.1 + 0.5 * level) / 10
    for (let r = 0; r < rows; r++) {
      if (rand() > fillChance) continue
      field[r * cols + c] = clamp(level * 0.7 + rand() * 0.3, 0.1, 1)
    }
  }
  return field
}
