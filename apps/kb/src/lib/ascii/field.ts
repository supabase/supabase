export interface PixelRect {
  left: number
  top: number
  right: number
  bottom: number
}

interface PhaseParams {
  t: number
  start: number
  length: number
}

interface BeamParams {
  col: number
  row: number
  now?: number
}

export const RAMP = [' ', '·', '░', '▒', '▓'] as const

export const CELL_WIDTH = 120
export const CELL_HEIGHT = 26
export const GLYPH_PITCH = 12

export const BEAM_ALPHA = 0.7

export const hash = (a: number, b: number) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export const rampGlyph = (density: number) =>
  RAMP[Math.min(RAMP.length - 1, Math.floor(density * RAMP.length))]

export const isBeamAt = ({ col, row, now = 0 }: BeamParams) =>
  hash(col + row * 31, Math.floor(now / 600 + hash(row, col))) < 0.04

export const uniformEdges = ({ size, step }: { size: number; step: number }): number[] =>
  Array.from({ length: Math.ceil(Math.max(0, size) / step) + 1 }, (_, i) => i * step)

export const fitEdges = ({ size, target }: { size: number; target: number }): number[] => {
  const count = size > 0 ? Math.max(1, Math.round(size / target)) : 0
  return Array.from(
    { length: count + 1 },
    (_, i) => Math.round(((i * size) / count || 0) * 100) / 100
  )
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const phase = ({ t, start, length }: PhaseParams) => clamp((t - start) / length, 0, 1)

export const drawStep = (progress: number) => Math.floor(progress * 8) / 8
