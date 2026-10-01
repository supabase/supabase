import { createRng, type PixelRect } from './field'

interface PunchGrainParams {
  ctx: CanvasRenderingContext2D
  pattern: CanvasPattern
  rect: PixelRect
}

const GRAIN_TILE = 132
const GRAIN_CLUMP = 3
const GRAIN_CLUMP_WEIGHT = 0.6
const GRAIN_THRESHOLD = 0.43
const GRAIN_CONTRAST = 9
const GRAIN_SEED = 20261001

export const grainAlpha = (size = GRAIN_TILE): Uint8ClampedArray => {
  const rand = createRng(GRAIN_SEED)
  const lattice = size / GRAIN_CLUMP
  const clumps = Float32Array.from({ length: lattice * lattice }, rand)
  const clumpAt = (cx: number, cy: number) => clumps[(cy % lattice) * lattice + (cx % lattice)]
  const alpha = new Uint8ClampedArray(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / GRAIN_CLUMP
      const gy = y / GRAIN_CLUMP
      const cx = Math.floor(gx)
      const cy = Math.floor(gy)
      const tx = gx - cx
      const ty = gy - cy
      const top = clumpAt(cx, cy) * (1 - tx) + clumpAt(cx + 1, cy) * tx
      const bottom = clumpAt(cx, cy + 1) * (1 - tx) + clumpAt(cx + 1, cy + 1) * tx
      const clump = top * (1 - ty) + bottom * ty
      const noise = clump * GRAIN_CLUMP_WEIGHT + rand() * (1 - GRAIN_CLUMP_WEIGHT)
      alpha[y * size + x] = (GRAIN_THRESHOLD - noise) * GRAIN_CONTRAST * 255
    }
  }
  return alpha
}

export const createGrainPattern = (ctx: CanvasRenderingContext2D): CanvasPattern | null => {
  const tile = document.createElement('canvas')
  tile.width = GRAIN_TILE
  tile.height = GRAIN_TILE
  const tileCtx = tile.getContext('2d')
  if (!tileCtx) return null
  const specks = tileCtx.createImageData(GRAIN_TILE, GRAIN_TILE)
  grainAlpha().forEach((value, i) => {
    specks.data[i * 4 + 3] = value
  })
  tileCtx.putImageData(specks, 0, 0)
  return ctx.createPattern(tile, 'repeat')
}

export const punchGrain = ({ ctx, pattern, rect }: PunchGrainParams) => {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.globalAlpha = 1
  ctx.fillStyle = pattern
  ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top)
  ctx.restore()
}
