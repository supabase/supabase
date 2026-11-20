import type { IsoPoint } from 'ui-patterns/IsoShape/IsoShape.geometry'

interface CanvasLayer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

interface SizeLayersParams {
  contexts: CanvasRenderingContext2D[]
  width: number
  height: number
}

export const createLayer = (): CanvasLayer | null => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  return ctx ? { canvas, ctx } : null
}

// each layer gets device pixels, while drawing stays in css pixels
export const sizeLayers = ({ contexts, width, height }: SizeLayersParams) => {
  // a pinch zoom changes the visual viewport scale, not the device pixel ratio
  const ratio = Math.min(
    (window.devicePixelRatio || 1) * (window.visualViewport?.scale ?? 1),
    // safari blanks a canvas past about 16M px, so a deep zoom caps the resolution
    Math.sqrt(16_000_000 / Math.max(width * height, 1))
  )
  for (const ctx of contexts) {
    ctx.canvas.width = Math.round(width * ratio)
    ctx.canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
}

export const tracePolygon = (ctx: CanvasRenderingContext2D, polygon: IsoPoint[]) => {
  ctx.beginPath()
  for (const [x, y] of polygon) ctx.lineTo(x, y)
  ctx.closePath()
}
