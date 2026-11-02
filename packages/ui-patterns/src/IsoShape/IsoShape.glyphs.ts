interface BeamParams {
  col: number
  row: number
  now?: number
}

export const RAMP = [' ', '·', '░', '▒', '▓'] as const

export const BEAM_ALPHA = 0.7

export const hash = (a: number, b: number) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export const rampGlyph = (density: number) =>
  RAMP[Math.min(RAMP.length - 1, Math.floor(density * RAMP.length))]

export const isBeamAt = ({ col, row, now = 0 }: BeamParams) =>
  hash(col + row * 31, Math.floor(now / 600 + hash(row, col))) < 0.04
