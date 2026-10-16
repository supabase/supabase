interface CanvasLayer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export const createLayer = (): CanvasLayer | null => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  return ctx ? { canvas, ctx } : null
}
