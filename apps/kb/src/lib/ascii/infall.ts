import { hash, phase, RAMP } from './field'
import { invertWarp, projectWarp, tangentAngle, type WarpPoint, type WarpShape } from './warp'

export interface InfallGlyph {
  root: HTMLElement
  char: HTMLElement
  glyph: HTMLElement
  rest: WarpPoint
  delay: number
}

interface MeasureInfallParams {
  container: HTMLElement
  origin: DOMRect
  throat: WarpPoint
}

interface PaintSettleParams {
  glyphs: InfallGlyph[]
  at: number
}

interface PaintInfallParams {
  throat: WarpPoint
  glyphs: InfallGlyph[]
  shape: WarpShape
  flatten: number
  lineY: number
  progress: number
}

export const measureInfall = ({
  container,
  origin,
  throat,
}: MeasureInfallParams): InfallGlyph[] => {
  const roots = [...container.querySelectorAll<HTMLElement>('[data-infall]')]
  // the rest position must not include the transform of the last frame
  for (const root of roots) root.style.transform = ''
  const glyphs = roots.flatMap((root) => {
    const [char, glyph] = root.children
    if (!(char instanceof HTMLElement) || !(glyph instanceof HTMLElement)) return []
    const rect = root.getBoundingClientRect()
    const rest = {
      x: (rect.left + rect.right) / 2 - origin.left,
      y: (rect.top + rect.bottom) / 2 - origin.top,
    }
    return [{ root, char, glyph, rest, delay: 0 }]
  })
  const farthest = Math.max(
    1,
    ...glyphs.map(({ rest }) => Math.hypot(rest.x - throat.x, rest.y - throat.y))
  )
  // glyphs near the throat go first, so the line of text bends into the warp
  return glyphs.map((glyph, index) => ({
    ...glyph,
    delay:
      (0.1 * Math.hypot(glyph.rest.x - throat.x, glyph.rest.y - throat.y)) / farthest +
      0.03 * hash(index, 7),
  }))
}

export const paintInfall = ({
  glyphs,
  throat,
  shape,
  flatten,
  lineY,
  progress,
}: PaintInfallParams): number => {
  let remaining = 0
  for (const { root, char, glyph, rest, delay } of glyphs) {
    const fall = phase({ t: progress, start: delay, length: 0.2 })
    // the rings end at the throat rim, so the last stretch drops the glyph into the hole
    const drop = phase({ t: fall, start: 0.65, length: 0.35 })
    remaining += (1 - drop) / glyphs.length
    const morph = phase({ t: fall, start: 0.7, length: 0.12 })
    char.style.opacity = `${1 - morph}`
    glyph.style.opacity = `${morph}`
    const nextGlyph = RAMP[Math.max(1, 3 - Math.floor(drop * 3))]
    if (glyph.textContent !== nextGlyph) glyph.textContent = nextGlyph
    if (fall === 0) {
      root.style.transform = ''
      root.style.filter = ''
      root.style.opacity = ''
      continue
    }

    const eased = fall * fall
    const start = invertWarp({
      shape,
      x: rest.x,
      y: lineY + (rest.y - lineY) / (1 - flatten),
    })
    // the angle stays fixed, so each glyph slides down its own spoke and both sides bend in
    const r = shape.r0 + (start.r - shape.r0) * (1 - eased)
    const from = projectWarp({ shape, ...start, flatten, lineY })
    const rim = projectWarp({ shape, r, angle: start.angle, flatten, lineY })
    const to = { x: rim.x + (throat.x - rim.x) * drop, y: rim.y + (throat.y - rim.y) * drop }
    const turn = tangentAngle({ shape, r, angle: start.angle }) - tangentAngle({ shape, ...start })
    const shrink = (1 - 0.5 * eased) * (1 - drop)
    root.style.transform = [
      `translate(${to.x - from.x}px, ${to.y - from.y}px)`,
      `rotate(${turn}rad)`,
      `scale(${shrink * (1 + 1.2 * eased)}, ${shrink * (1 - 0.5 * eased)})`,
    ].join(' ')
    root.style.filter = `blur(${eased + 2 * drop}px)`
    root.style.opacity = `${1 - phase({ t: drop, start: 0.5, length: 0.5 })}`
  }
  return remaining
}

export const paintSettle = ({ glyphs, at }: PaintSettleParams) => {
  for (const { root, char, glyph, delay } of glyphs) {
    const settled = 1 - (1 - phase({ t: at, start: delay * 2, length: 0.6 })) ** 3
    char.style.opacity = '1'
    glyph.style.opacity = '0'
    root.style.opacity = `${settled}`
    root.style.transform = settled < 1 ? `translateY(${(1 - settled) * 6}px)` : ''
    root.style.filter = settled < 1 ? `blur(${(1 - settled) * 3}px)` : ''
  }
}
