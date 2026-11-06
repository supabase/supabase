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
  COMPONENT_SPOTS,
  getCubeState,
  LAP_MS,
  RESTING_CUBE,
  type CubePiece,
  type CubeSpot,
  type CubeState,
  type LifecycleClock,
} from './lifecycle'

type Glyph = Point & { char: string }

type CubeDrawing = {
  /** The cube's outline, which fills with the surface color so it hides whatever is behind it. */
  hull: Point[]
  lines: Glyph[][]
  /** Which component this is, or null for the project. */
  component: number | null
}

type Drawing = {
  scale: number
  cubes: CubeDrawing[]
  links: Glyph[][]
  logo: (Glyph & { rise: number })[]
  top: number
  bottom: number
}

const PROJECT: CubeSpot = { x: 0, y: 0, size: 1 }

// The corners that can be seen from above
const getCube = ({ x, y, size }: CubeSpot) => {
  const half = size / 2
  const bottom: Point3 = [x + half, y + half, 0]
  const leftBottom: Point3 = [x - half, y + half, 0]
  const leftTop: Point3 = [x - half, y + half, size]
  const center: Point3 = [x + half, y + half, size]
  const rightBottom: Point3 = [x + half, y - half, 0]
  const rightTop: Point3 = [x + half, y - half, size]
  const top: Point3 = [x - half, y - half, size]
  return {
    // The left side, then the right, then the top. They share no edges, so tracing one never redraws
    // another.
    sides: [
      [center, bottom, leftBottom, leftTop, center],
      [bottom, rightBottom, rightTop, center],
      [rightTop, top, leftTop],
    ],
    hull: [bottom, rightBottom, rightTop, top, leftTop, leftBottom],
  }
}

const SPOTS = [PROJECT, ...COMPONENT_SPOTS]
const SCENE = SPOTS.flatMap((spot) => getCube(spot).hull.map(project))
const SCENE_HALF_WIDTH = Math.max(...SCENE.map(({ x }) => Math.abs(x)))
const SCENE_TOP = Math.min(...SCENE.map(({ y }) => y))
const SCENE_BOTTOM = Math.max(...SCENE.map(({ y }) => y))

const LOGO = logoOn({ x: -0.5, y: -0.5, z: 0, w: 1, d: 1, h: 1 })

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

/** Your Supabase project and its components, going through the life cycle that the ring is timing. */
export function LifecycleCube({
  text,
  clock,
  className,
}: {
  text: string
  clock: LifecycleClock
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const glyphText = text.toUpperCase()
    const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let fit = 0
    let originY = 0
    let drawing: Drawing | null = null
    let colors = { line: '', accent: '', issue: '', surface: '' }
    let frame = 0

    const readColors = () => {
      const { color, caretColor, accentColor, textDecorationColor } = getComputedStyle(canvas)
      colors = {
        line: toOpaque(color, caretColor),
        accent: toOpaque(accentColor, caretColor),
        issue: toOpaque(textDecorationColor, caretColor),
        surface: caretColor,
      }
    }

    // The glyphs stay the same size as the project grows, so it's redrawn rather than scaled up
    const getDrawing = (scale: number): Drawing => {
      if (drawing?.scale === scale) return drawing

      const toCanvas = ([x, y, z]: Point3): Point => {
        const point = project([x * scale, y * scale, z * scale])
        return { x: canvas.clientWidth / 2 + point.x * fit, y: originY + point.y * fit }
      }

      // Each line starts at a different place in the text, so neighbor lines don't repeat
      let lineCount = 0
      const toGlyphs = (points: Point3[]): Glyph[] => {
        const start = lineCount++ * 1009
        return glyphsAlong(points.map(toCanvas)).map((glyph, i) => ({
          ...glyph,
          char: glyphText[(start + i) % glyphText.length],
        }))
      }

      const cubes = SPOTS.map((spot, index): CubeDrawing & { depth: number } => {
        const { sides, hull } = getCube(spot)
        const isProject = index === 0
        return {
          hull: hull.map(toCanvas),
          // A component has no sides of its own to rework, so it's traced as one line
          lines: isProject ? sides.map(toGlyphs) : [sides.flatMap(toGlyphs)],
          component: isProject ? null : index - 1,
          depth: spot.x + spot.y,
        }
      }).sort((a, b) => a.depth - b.depth)

      const logoPoints = LOGO.map(toCanvas)
      const ys = logoPoints.map(({ y }) => y)
      const xs = logoPoints.map(({ x }) => x)
      const [minY, maxY] = [Math.min(...ys), Math.max(...ys)]
      const logo: Drawing['logo'] = []
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

      const hullYs = cubes.flatMap(({ hull }) => hull.map(({ y }) => y))
      drawing = {
        scale,
        cubes,
        links: COMPONENT_SPOTS.map(({ x, y }) =>
          toGlyphs([
            [0, 0, 0],
            [x, y, 0],
          ])
        ),
        logo,
        top: Math.min(...hullYs),
        bottom: Math.max(...hullYs),
      }
      return drawing
    }

    const draw = (glyphs: Glyph[], color: string, alpha: number) => {
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      for (const { x, y, char } of glyphs) ctx.fillText(char, x, y)
    }

    const fillHull = (hull: Point[]) => {
      ctx.beginPath()
      for (const { x, y } of hull) ctx.lineTo(x, y)
      ctx.closePath()
      ctx.fillStyle = colors.surface
      ctx.globalAlpha = 1
      ctx.fill()
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

    const paintScan = ({ cubes, top, bottom }: Drawing, state: CubeState, scan: number) => {
      const scanY = top + scan * (bottom - top)
      ctx.fillStyle = colors.accent
      for (const { lines, component } of cubes) {
        const pieces = component === null ? state.pieces : [state.components[component]]
        lines.forEach((glyphs, index) => {
          const builtCount = Math.round(pieces[index].built * glyphs.length)
          for (let i = 0; i < builtCount; i++) {
            const distance = Math.abs(glyphs[i].y - scanY)
            if (distance > SCAN_REACH_PX) continue
            ctx.globalAlpha = (1 - distance / SCAN_REACH_PX) ** 2
            ctx.fillText(glyphs[i].char, glyphs[i].x, glyphs[i].y)
          }
        })
      }
    }

    const paint = (state: CubeState) => {
      const current = getDrawing(state.scale)
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.save()
      ctx.translate(0, -state.lift * LIFT_PX)

      // The lines go first, so the cubes at either end hide where they meet
      state.components.forEach(({ link }, index) => {
        const glyphs = current.links[index]
        draw(glyphs.slice(0, Math.round(link * glyphs.length)), colors.line, 1)
      })

      for (const { hull, lines, component } of current.cubes) {
        if (component === null) {
          fillHull(hull)
          lines.forEach((glyphs, index) => paintPiece(glyphs, state.pieces[index]))
          draw(
            current.logo.filter(({ rise }) => rise <= state.logo),
            colors.accent,
            1
          )
          continue
        }
        const piece = state.components[component]
        if (piece.link > 0) fillHull(hull)
        // A component only starts to appear once the line has reached it
        if (piece.link === 1) paintPiece(lines[0], piece)
      }

      if (state.scan !== null) paintScan(current, state, state.scan)
      ctx.restore()
    }

    const tick = () => {
      const box = canvas.getBoundingClientRect()
      if (box.bottom > 0 && box.top < innerHeight) {
        const lived = clock.read()
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

      // Leaves room above the project for it to lift into
      fit = Math.min(
        width / (SCENE_HALF_WIDTH * 2),
        (height - LIFT_PX - GLYPH_SIZE) / (SCENE_BOTTOM - SCENE_TOP)
      )
      originY = LIFT_PX - SCENE_TOP * fit
      drawing = null

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
  }, [text, clock])

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
