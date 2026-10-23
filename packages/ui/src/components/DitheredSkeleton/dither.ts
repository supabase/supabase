// Classic 8x8 ordered-dither matrix, normalized to (0, 1) thresholds.
export const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((value) => (value + 0.5) / 64)

export function hash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

export const SWEEP_PERIOD_PX = 1100
export const SWEEP_VELOCITY_PX_PER_MS = 0.42
// The sweep travels along `x + 0.5y`. A 1:2 slope keeps the band tile an exact 1100x2200px.
export const SWEEP_SLOPE = 0.5
export const SWEEP_NORM = Math.hypot(1, SWEEP_SLOPE)
export const SWEEP_ANGLE_DEG = 90 + (Math.atan(SWEEP_SLOPE) * 180) / Math.PI

// Reading every skeleton's position in one frame avoids a forced layout per instance on mount.
const pendingOrigins = new Map<HTMLElement, (left: number, top: number) => void>()
let originFrame: number | null = null

export function scheduleOrigin(element: HTMLElement, apply: (left: number, top: number) => void) {
  pendingOrigins.set(element, apply)
  originFrame ??= requestAnimationFrame(() => {
    originFrame = null
    const entries = [...pendingOrigins]
    pendingOrigins.clear()
    const rects = entries.map(([target]) => target.getBoundingClientRect())
    entries.forEach(([, applyOrigin], index) =>
      applyOrigin(rects[index].left + window.scrollX, rects[index].top + window.scrollY)
    )
  })
  return () => {
    pendingOrigins.delete(element)
  }
}

export function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}
