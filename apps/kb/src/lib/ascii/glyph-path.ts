interface GlyphPoint {
  x: number
  y: number
}

interface FillGlyphPathParams {
  ctx: CanvasRenderingContext2D
  points: GlyphPoint[]
  isClosed: boolean
  text: string
  offset: number
  surface: string
  visible?: boolean[]
}

interface CirclePointsParams {
  cx: number
  cy: number
  radius: number
  from?: number
  to?: number
}

// in css px. glyphs this small read as a line at 100%, and as text once the page is zoomed in
const GLYPH_SIZE = 2.2
export const GLYPH_FONT = `${GLYPH_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`

export const fillGlyphPath = ({
  ctx,
  points,
  isClosed,
  text,
  offset,
  surface,
  visible,
}: FillGlyphPathParams): number => {
  const count = isClosed ? points.length : points.length - 1
  const glyphs: GlyphPoint[] = []
  let carry = 0
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % points.length
    if (visible && (!visible[i] || !visible[next])) continue
    const dx = points[next].x - points[i].x
    const dy = points[next].y - points[i].y
    const length = Math.hypot(dx, dy)
    if (!length) continue
    // an upright glyph box is 0.65 wide and 1 tall, so the step is the box size along the segment
    const step = GLYPH_SIZE * ((Math.abs(dx) * 0.65 + Math.abs(dy)) / length)
    let distance = carry
    for (; distance < length; distance += step) {
      glyphs.push({
        x: points[i].x + (dx * distance) / length,
        y: points[i].y + (dy * distance) / length,
      })
    }
    carry = distance - length
  }

  // the cells of one line only touch, so the line draws all its cells before its glyphs
  const color = ctx.fillStyle
  ctx.beginPath()
  for (const { x, y } of glyphs) {
    ctx.rect(x - GLYPH_SIZE * 0.325, y - GLYPH_SIZE * 0.5, GLYPH_SIZE * 0.65, GLYPH_SIZE)
  }
  ctx.fillStyle = surface
  ctx.fill()
  ctx.fillStyle = color
  glyphs.forEach(({ x, y }, index) => ctx.fillText(text[(offset + index) % text.length], x, y))
  // the next text index, so a caller can continue the text on another path
  return offset + glyphs.length
}

export const circlePoints = ({
  cx,
  cy,
  radius,
  from = 0,
  to = Math.PI * 2,
}: CirclePointsParams): GlyphPoint[] =>
  Array.from({ length: 97 }, (_, step) => {
    const angle = from + ((to - from) * step) / 96
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })
