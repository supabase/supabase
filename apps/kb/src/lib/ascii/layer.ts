import type { IsoPoint } from '../iso-shapes'

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
  const dpr = window.devicePixelRatio || 1
  for (const ctx of contexts) {
    ctx.canvas.width = Math.round(width * dpr)
    ctx.canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
}

export const tracePolygon = (ctx: CanvasRenderingContext2D, polygon: IsoPoint[]) => {
  ctx.beginPath()
  for (const [x, y] of polygon) ctx.lineTo(x, y)
  ctx.closePath()
}
