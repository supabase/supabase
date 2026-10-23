'use client'

import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'
import {
  BAYER_8,
  hash,
  mod,
  scheduleOrigin,
  SWEEP_ANGLE_DEG,
  SWEEP_NORM,
  SWEEP_PERIOD_PX,
  SWEEP_SLOPE,
  SWEEP_VELOCITY_PX_PER_MS,
} from './dither'

const TILE_CELLS = 128
// Each level lights the cells that pass the dither threshold while the shine is at least this bright.
const BAND_LEVELS = [0.2, 0.5, 0.85]
const BAND_OPACITY = [0.4, 0.5, 0.6]
const HIDDEN_MASK = 'linear-gradient(transparent, transparent)'

interface DitherTextures {
  cell: number
  tileSize: number
  base: string
  bands: string[]
}

const textureCache = new Map<string, DitherTextures>()

function tileableNoise(period: number) {
  return (u: number, v: number) => {
    const x = u * period
    const y = v * period
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const sx = xf * xf * (3 - 2 * xf)
    const sy = yf * yf * (3 - 2 * yf)
    const x0 = xi % period
    const y0 = yi % period
    const x1 = (xi + 1) % period
    const y1 = (yi + 1) % period
    const a = hash(x0, y0)
    const b = hash(x1, y0)
    const c = hash(x0, y1)
    const d = hash(x1, y1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

// Bakes the noise and dither into one small seamless tile per layer, once per cell size.
// After that, every instance on the page reuses the same images and no per-frame work is done.
function getTextures(pixelSize: number): DitherTextures | null {
  const dpr = window.devicePixelRatio || 1
  const deviceCell = Math.max(1, Math.round(pixelSize * dpr))
  const key = `${deviceCell}:${dpr}`
  const cached = textureCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TILE_CELLS * deviceCell
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const cell = deviceCell / dpr
  const tileSize = TILE_CELLS * cell
  const coarse = tileableNoise(Math.max(1, Math.round(tileSize / 22)))
  const fine = tileableNoise(Math.max(1, Math.round(tileSize / 7)))

  // -1 is never lit, 0 is the resting texture, 1..n light up inside progressively brighter bands.
  const levels = new Int8Array(TILE_CELLS * TILE_CELLS).fill(-1)
  for (let y = 0; y < TILE_CELLS; y++) {
    for (let x = 0; x < TILE_CELLS; x++) {
      const grain =
        coarse(x / TILE_CELLS, y / TILE_CELLS) * 0.65 + fine(x / TILE_CELLS, y / TILE_CELLS) * 0.35
      const threshold = BAYER_8[(y & 7) * 8 + (x & 7)]
      const resting = 0.05 + grain * 0.14
      const index = y * TILE_CELLS + x
      if (resting > threshold) {
        levels[index] = 0
        continue
      }
      const level = BAND_LEVELS.findIndex(
        (band) => resting + band * (0.35 + grain * 0.55) > threshold
      )
      if (level !== -1) levels[index] = level + 1
    }
  }

  const paintLevel = (level: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    for (let index = 0; index < levels.length; index++) {
      if (levels[index] !== level) continue
      const x = index % TILE_CELLS
      const y = (index - x) / TILE_CELLS
      ctx.fillRect(x * deviceCell, y * deviceCell, deviceCell, deviceCell)
    }
    return `url(${canvas.toDataURL('image/png')})`
  }

  const textures = {
    cell,
    tileSize,
    base: paintLevel(0),
    bands: BAND_LEVELS.map((_, level) => paintLevel(level + 1)),
  }
  textureCache.set(key, textures)
  return textures
}

// A seamless 1100x2200px tile of the diagonal shine band at one brightness level.
// Sharp leading edge, long soft tail, matching the canvas version's falloff.
function bandGradient(level: number) {
  const reach = Math.sqrt(-Math.log(BAND_LEVELS[level]))
  const center = SWEEP_PERIOD_PX / 2
  const start = (center - 220 * reach) / SWEEP_NORM
  const end = (center + 70 * reach) / SWEEP_NORM
  const period = SWEEP_PERIOD_PX / SWEEP_NORM
  return `repeating-linear-gradient(${SWEEP_ANGLE_DEG}deg, transparent 0px, transparent ${start}px, currentColor ${start}px, currentColor ${end}px, transparent ${end}px, transparent ${period}px)`
}

const BAND_GRADIENTS = BAND_LEVELS.map((_, level) => bandGradient(level))

function maskStyle(variable: string): CSSProperties {
  const image = `var(${variable}, ${HIDDEN_MASK})`
  const size = 'var(--dither-tile-size, auto)'
  const position = 'var(--dither-origin, 0 0)'
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: size,
    WebkitMaskSize: size,
    maskPosition: position,
    WebkitMaskPosition: position,
    maskRepeat: 'repeat',
    WebkitMaskRepeat: 'repeat',
  }
}

export interface DitheredSkeletonLiteProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of one dither cell in CSS pixels. Larger values feel chunkier and more lo-fi.
   * Values below `1` render at device resolution (e.g. `0.5` is one physical pixel on a 2x screen).
   */
  pixelSize?: number
  /** Multiplier for the shine sweep. */
  speed?: number
}

/**
 * A `DitheredSkeleton` that does no per-frame JavaScript. The dither is baked once into shared
 * mask tiles and the shine is a stepped `transform` animation that runs on the compositor.
 */
export function DitheredSkeletonLite({
  className,
  pixelSize = 2,
  speed = 1,
  ...props
}: DitheredSkeletonLiteProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const textures = root ? getTextures(pixelSize) : null
    if (!root || !textures) return

    const { cell, tileSize } = textures
    root.style.setProperty('--dither-tile-size', `${tileSize}px ${tileSize}px`)
    root.style.setProperty('--dither-base', textures.base)
    textures.bands.forEach((band, level) => root.style.setProperty(`--dither-band-${level}`, band))

    const sweeps = Array.from(root.querySelectorAll<HTMLElement>('[data-dither-sweep]'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animations: Animation[] = []

    const syncMotion = () => {
      animations.forEach((animation) => animation.cancel())
      animations = []
      if (reducedMotion.matches) {
        sweeps.forEach(
          (sweep) => (sweep.style.transform = `translateX(${SWEEP_PERIOD_PX * 0.35}px)`)
        )
        return
      }
      sweeps.forEach((sweep) => {
        sweep.style.transform = ''
        const animation = sweep.animate(
          [{ transform: 'translateX(0px)' }, { transform: `translateX(${SWEEP_PERIOD_PX}px)` }],
          {
            duration: SWEEP_PERIOD_PX / (SWEEP_VELOCITY_PX_PER_MS * speed),
            iterations: Infinity,
            // Whole-cell steps keep the band edge crisp instead of sub-pixel blurred.
            easing: `steps(${Math.round(SWEEP_PERIOD_PX / cell)})`,
          }
        )
        // Pinning every sweep to the document timeline keeps all instances in phase.
        animation.startTime = 0
        animations.push(animation)
      })
    }

    // Anchor the dither grid and the band to page coordinates so neighbors read as one surface.
    const cancelOrigin = scheduleOrigin(root, (left, top) => {
      const originX = Math.round(mod(-left, tileSize))
      const originY = Math.round(mod(-top, tileSize))
      root.style.setProperty('--dither-origin', `${originX}px ${originY}px`)
      const phase = mod(-(left + top * SWEEP_SLOPE), SWEEP_PERIOD_PX)
      root.style.setProperty('--dither-sweep-offset', `${Math.round(phase / cell) * cell}px`)
    })

    syncMotion()
    reducedMotion.addEventListener('change', syncMotion)

    return () => {
      cancelOrigin()
      reducedMotion.removeEventListener('change', syncMotion)
      animations.forEach((animation) => animation.cancel())
    }
  }, [pixelSize, speed])

  return (
    <div
      ref={rootRef}
      className={cn('relative overflow-hidden rounded-md bg-muted isolate', className)}
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 text-foreground-lighter">
        <div
          className="absolute inset-0 bg-current opacity-25"
          style={maskStyle('--dither-base')}
        />
        {BAND_GRADIENTS.map((gradient, level) => (
          <div
            key={level}
            className="absolute inset-0"
            style={{ ...maskStyle(`--dither-band-${level}`), opacity: BAND_OPACITY[level] }}
          >
            <div
              data-dither-sweep
              className="absolute inset-y-0 right-0"
              style={{
                left: -SWEEP_PERIOD_PX,
                backgroundImage: gradient,
                backgroundSize: `${SWEEP_PERIOD_PX}px ${SWEEP_PERIOD_PX / SWEEP_SLOPE}px`,
                backgroundPosition: 'var(--dither-sweep-offset, 0px) 0px',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
