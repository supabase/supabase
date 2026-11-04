// ui-patterns holds the glyph rules, so docs shapes fill like kb covers
export { BEAM_ALPHA, hash, isBeamAt, RAMP, rampGlyph } from 'ui-patterns/IsoShape/IsoShape.glyphs'

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

export const CELL_WIDTH = 120
export const CELL_HEIGHT = 26
export const GLYPH_PITCH = 12

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
