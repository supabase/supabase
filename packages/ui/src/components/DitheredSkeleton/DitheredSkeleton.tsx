'use client'

import { useEffect, useRef, type HTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'

// Classic 8x8 ordered-dither matrix, normalized to (0, 1) thresholds.
const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((value) => (value + 0.5) / 64)

const FRAME_INTERVAL_MS = 1000 / 30
const SWEEP_PERIOD_PX = 1100
const SWEEP_VELOCITY_PX_PER_MS = 0.42
const COLOR_REFRESH_FRAMES = 30

type Renderer = (now: number) => void

const renderers = new Set<Renderer>()
let frameId: number | null = null
let lastFrameTime = 0

function tick(now: number) {
  frameId = requestAnimationFrame(tick)
  if (now - lastFrameTime < FRAME_INTERVAL_MS) return
  lastFrameTime = now
  renderers.forEach((render) => render(now))
}

// A single shared loop keeps many skeletons on one page in lockstep and cheap.
function subscribe(render: Renderer) {
  renderers.add(render)
  if (frameId === null) frameId = requestAnimationFrame(tick)
  return () => {
    renderers.delete(render)
    if (renderers.size === 0 && frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  }
}

function hash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

let colorProbe: CanvasRenderingContext2D | null = null

// Resolves any CSS color format (hsl, oklch, color-mix…) to RGB by painting it.
function resolveRgb(cssColor: string): [number, number, number] {
  colorProbe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!colorProbe) return [128, 128, 128]
  colorProbe.clearRect(0, 0, 1, 1)
  colorProbe.fillStyle = cssColor
  colorProbe.fillRect(0, 0, 1, 1)
  const [r, g, b] = colorProbe.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

export interface DitheredSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of one dither cell in CSS pixels. Larger values feel chunkier and more lo-fi. */
  pixelSize?: number
  /** Multiplier for the shine sweep and texture drift. */
  speed?: number
}

export function DitheredSkeleton({
  className,
  pixelSize = 2,
  speed = 1,
  ...props
}: DitheredSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const cell = Math.max(1, Math.round(pixelSize))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let image: ImageData | null = null
    let rgb = resolveRgb(getComputedStyle(canvas).color)
    let framesSinceColorRefresh = 0
    let unsubscribe: (() => void) | null = null
    let isVisible = false

    const render = (now: number) => {
      if (!image) return

      if (++framesSinceColorRefresh >= COLOR_REFRESH_FRAMES) {
        framesSinceColorRefresh = 0
        rgb = resolveRgb(getComputedStyle(canvas).color)
      }

      const rect = canvas.getBoundingClientRect()
      const originX = Math.floor((rect.left + window.scrollX) / cell)
      const originY = Math.floor((rect.top + window.scrollY) / cell)
      const t = reducedMotion.matches ? 0 : now * speed
      const drift = t * 0.00004
      const sweep = reducedMotion.matches
        ? SWEEP_PERIOD_PX * 0.35
        : (t * SWEEP_VELOCITY_PX_PER_MS) % SWEEP_PERIOD_PX
      const { width, height, data } = image
      const [r, g, b] = rgb

      for (let y = 0; y < height; y++) {
        const gy = originY + y
        const wy = gy * cell
        const bayerRow = (gy & 7) * 8

        for (let x = 0; x < width; x++) {
          const gx = originX + x
          const wx = gx * cell

          // Two octaves of drifting noise give the base its mottled, paper-like grain.
          const grain =
            valueNoise(wx / 22 + drift * 40, wy / 22 - drift * 25) * 0.65 +
            valueNoise(wx / 7 - drift * 90, wy / 7 + drift * 60) * 0.35

          // Low-frequency noise bends the shine band so its edge ripples organically.
          const warp = (valueNoise(wy / 70 + drift * 20, wx / 260) - 0.5) * 160

          let distance = wx + wy * 0.6 + warp - sweep
          distance -= Math.round(distance / SWEEP_PERIOD_PX) * SWEEP_PERIOD_PX

          // Sharp leading edge, long soft tail, like light catching a surface.
          const falloff = distance > 0 ? distance / 70 : distance / 220
          const band = Math.exp(-falloff * falloff)

          const intensity = 0.05 + grain * 0.14 + band * (0.35 + grain * 0.55)
          const index = (y * width + x) * 4

          data[index] = r
          data[index + 1] = g
          data[index + 2] = b
          data[index + 3] =
            intensity > BAYER_8[bayerRow + (gx & 7)] ? 50 + Math.min(intensity, 1) * 110 : 0
        }
      }

      ctx.putImageData(image, 0, 0)
    }

    const syncLoop = () => {
      const shouldAnimate = isVisible && !reducedMotion.matches
      if (shouldAnimate && !unsubscribe) unsubscribe = subscribe(render)
      if (!shouldAnimate && unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      if (!shouldAnimate) render(performance.now())
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.ceil(entry.contentRect.width / cell))
      const height = Math.max(1, Math.ceil(entry.contentRect.height / cell))
      if (image?.width === width && image.height === height) return
      canvas.width = width
      canvas.height = height
      image = ctx.createImageData(width, height)
      render(performance.now())
    })

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      syncLoop()
    })

    resizeObserver.observe(canvas)
    intersectionObserver.observe(canvas)
    reducedMotion.addEventListener('change', syncLoop)

    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      reducedMotion.removeEventListener('change', syncLoop)
      unsubscribe?.()
    }
  }, [pixelSize, speed])

  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-muted isolate', className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full text-foreground-lighter [image-rendering:pixelated]"
      />
    </div>
  )
}
