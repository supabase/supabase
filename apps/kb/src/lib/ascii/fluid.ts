import type { IsoPoint } from '../iso-shapes'
import { BEAM_ALPHA, hash, isBeamAt, rampGlyph } from './field'
import { tracePolygon } from './layer'

interface DrawFluidParams {
  ctx: CanvasRenderingContext2D
  area: IsoPoint[]
  level: number
  now: number
  color: string
  beam: string
  flow: 'up' | 'down'
}

const FLUID_COLUMN = 8
const FLUID_ROW = 10
export const FLUID_RISE_MS = 200

export const drawFluid = ({ ctx, area, level, now, color, beam, flow }: DrawFluidParams) => {
  if (level <= 0) return
  const ys = area.map(([, y]) => y)
  const xs = area.map(([x]) => x)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const edge = flow === 'down' ? Math.min(...ys) : Math.max(...ys)
  const step = flow === 'down' ? FLUID_ROW : -FLUID_ROW
  const reach = (Math.max(...ys) - Math.min(...ys)) * level
  const drift = Math.floor(now / FLUID_RISE_MS)
  ctx.save()
  tracePolygon(ctx, area)
  ctx.clip()
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let row = 0; row * FLUID_ROW < reach; row++) {
    const y = edge + row * step
    const depth = 1 - (row * FLUID_ROW) / Math.max(1, reach)
    for (let col = 0; left + col * FLUID_COLUMN < right; col++) {
      const cell = row - drift
      const density = hash(col, cell) * (0.35 + 0.65 * depth)
      const glyph = rampGlyph(density)
      if (glyph === ' ') continue
      const isBeam = isBeamAt({ col, row: cell, now })
      ctx.fillStyle = isBeam ? beam : color
      ctx.globalAlpha = isBeam ? BEAM_ALPHA : 1
      ctx.fillText(glyph, left + col * FLUID_COLUMN, y)
    }
  }
  ctx.restore()
}
