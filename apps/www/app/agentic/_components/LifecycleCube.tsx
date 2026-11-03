'use client'

import { useEffect, useRef } from 'react'
import { cn } from 'ui'
import { toOpaque } from 'ui-patterns/GlyphLines'

import {
  GLYPH_FONT,
  GLYPH_SIZE,
  glyphsAlong,
  logoOn,
  project,
  type Point,
  type Point3,
} from './art'
import {
  getCubeState,
  LAP_MS,
  LIFECYCLE_STARTS_AT_MS,
  RESTING_CUBE,
  type CubePiece,
  type CubeState,
} from './lifecycle'

type Glyph = Point & { char: string }

// The corners of a unit cube that can be seen from above
const BOTTOM: Point3 = [1, 1, 0]
const LEFT_BOTTOM: Point3 = [0, 1, 0]
const LEFT_TOP: Point3 = [0, 1, 1]
const CENTER: Point3 = [1, 1, 1]
const RIGHT_BOTTOM: Point3 = [1, 0, 0]
const RIGHT_TOP: Point3 = [1, 0, 1]
const TOP: Point3 = [0, 0, 1]

// The left side, then the right, then the top. They share no edges, so tracing one never redraws
// another.
const PIECES: Point3[][] = [
  [CENTER, BOTTOM, LEFT_BOTTOM, LEFT_TOP, CENTER],
  [BOTTOM, RIGHT_BOTTOM, RIGHT_TOP, CENTER],
  [RIGHT_TOP, TOP, LEFT_TOP],
]

const LOGO = logoOn({ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 })
const CUBE_HALF_WIDTH = project(RIGHT_TOP).x
const CUBE_HALF_HEIGHT = project(BOTTOM).y

const LIFT_PX = 10
const OUTLINE_ALPHA = 0.3
const SCAN_REACH_PX = 14

const isInside = ({ x, y }: Point, polygon: Point[]) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = [polygon[i], polygon[j]]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

/** Your Supabase project, going through the life cycle that the ring around it is timing. */
export function LifecycleCube({ text, className }: { text: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const glyphText = text.toUpperCase()
    const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const startedAt = performance.now()
    let pieces: Glyph[][] = []
    let logo: (Glyph & { rise: number })[] = []
    let top = 0
    let bottom = 0
    let colors = { line: '', accent: '', issue: '' }
    let frame = 0

    const readColors = () => {
      const { color, caretColor, accentColor, textDecorationColor } = getComputedStyle(canvas)
      colors = {
        line: toOpaque(color, caretColor),
        accent: toOpaque(accentColor, caretColor),
        issue: toOpaque(textDecorationColor, caretColor),
      }
    }

    const draw = (glyphs: Glyph[], color: string, alpha: number) => {
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      for (const { x, y, char } of glyphs) ctx.fillText(char, x, y)
    }

    const paintPiece = (glyphs: Glyph[], piece: CubePiece) => {
      const builtCount = Math.round(piece.built * glyphs.length)
      const built = glyphs.slice(0, builtCount)
      draw(glyphs.slice(builtCount), colors.line, OUTLINE_ALPHA)
      if (piece.isBroken) {
        const repairedCount = Math.round(piece.repaired * builtCount)
        draw(built.slice(repairedCount), colors.issue, 1)
        draw(built.slice(0, repairedCount), colors.accent, 1)
        return
      }
      draw(built, colors.line, 1)
      if (piece.glow > 0) draw(built, colors.accent, piece.glow)
    }

    const paintScan = (state: CubeState, scan: number) => {
      const scanY = top + scan * (bottom - top)
      ctx.fillStyle = colors.accent
      pieces.forEach((glyphs, index) => {
        const builtCount = Math.round(state.pieces[index].built * glyphs.length)
        for (let i = 0; i < builtCount; i++) {
          const distance = Math.abs(glyphs[i].y - scanY)
          if (distance > SCAN_REACH_PX) continue
          ctx.globalAlpha = (1 - distance / SCAN_REACH_PX) ** 2
          ctx.fillText(glyphs[i].char, glyphs[i].x, glyphs[i].y)
        }
      })
    }

    const paint = (state: CubeState) => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.save()
      ctx.translate(0, -state.lift * LIFT_PX)
      pieces.forEach((glyphs, index) => paintPiece(glyphs, state.pieces[index]))
      draw(
        logo.filter(({ rise }) => rise <= state.logo),
        colors.accent,
        1
      )
      if (state.scan !== null) paintScan(state, state.scan)
      ctx.restore()
    }

    const tick = () => {
      const box = canvas.getBoundingClientRect()
      if (box.bottom > 0 && box.top < innerHeight) {
        const lived = Math.max(performance.now() - startedAt - LIFECYCLE_STARTS_AT_MS, 0)
        paint(getCubeState((lived % LAP_MS) / LAP_MS, Math.floor(lived / LAP_MS)))
      }
      frame = requestAnimationFrame(tick)
    }

    const redraw = () => {
      cancelAnimationFrame(frame)
      readColors()
      if (isReducedMotion) paint(RESTING_CUBE)
      else tick()
    }

    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      const ratio = (window.devicePixelRatio || 1) * (visualViewport?.scale ?? 1)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.font = GLYPH_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Leaves room above the cube for it to lift into
      const fit = Math.min(
        width / (CUBE_HALF_WIDTH * 2),
        (height - LIFT_PX - GLYPH_SIZE) / (CUBE_HALF_HEIGHT * 2)
      )
      const toCanvas = ([x, y, z]: Point3): Point => {
        const point = project([x, y, z])
        return { x: width / 2 + point.x * fit, y: LIFT_PX + (point.y + CUBE_HALF_HEIGHT) * fit }
      }
      top = toCanvas(TOP).y
      bottom = toCanvas(BOTTOM).y

      // Each side starts at a different place in the text, so neighbor lines don't repeat
      pieces = PIECES.map((piece, index) =>
        glyphsAlong(piece.map(toCanvas)).map((glyph, i) => ({
          ...glyph,
          char: glyphText[(index * 1009 + i) % glyphText.length],
        }))
      )

      const logoPoints = LOGO.map(toCanvas)
      const ys = logoPoints.map(({ y }) => y)
      const xs = logoPoints.map(({ x }) => x)
      const [minY, maxY] = [Math.min(...ys), Math.max(...ys)]
      logo = []
      for (let y = minY; y < maxY; y += GLYPH_SIZE) {
        for (let x = Math.min(...xs); x < Math.max(...xs); x += GLYPH_SIZE * 0.65) {
          if (!isInside({ x, y }, logoPoints)) continue
          logo.push({
            x,
            y,
            char: glyphText[logo.length % glyphText.length],
            rise: (maxY - y) / (maxY - minY),
          })
        }
      }

      redraw()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    visualViewport?.addEventListener('resize', resize)
    const themeObserver = new MutationObserver(redraw)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visualViewport?.removeEventListener('resize', resize)
      themeObserver.disconnect()
    }
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // The drawing reads its colors from these, so they follow the theme
      className={cn(
        'block w-full text-foreground-muted caret-background accent-brand-600 decoration-destructive-600',
        className
      )}
    />
  )
}
