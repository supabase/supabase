import grainImage from '../../assets/grain.webp'

interface PunchGrainParams {
  ctx: CanvasRenderingContext2D
  pattern: CanvasPattern
  width: number
  height: number
}

let grain: Promise<HTMLImageElement | null> | undefined

export const loadGrain = async (ctx: CanvasRenderingContext2D): Promise<CanvasPattern | null> => {
  if (!grain) {
    const image = new Image()
    image.src = grainImage.src
    grain = image.decode().then(
      () => image,
      () => null
    )
  }
  const image = await grain
  return image ? ctx.createPattern(image, 'repeat') : null
}

export const punchGrain = ({ ctx, pattern, width, height }: PunchGrainParams) => {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.globalAlpha = 1
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
