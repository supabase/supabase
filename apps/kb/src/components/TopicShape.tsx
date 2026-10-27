import { useCallback } from 'react'
import { cn } from 'ui'
import { toOpaque } from 'ui-patterns/GlyphLines'

import { clamp } from '../lib/ascii/field'
import { circlePoints, fillGlyphPath, GLYPH_FONT } from '../lib/ascii/glyph-path'
import { sizeLayers } from '../lib/ascii/layer'
import { easeInOutCubic } from '../lib/ascii/warp'
import { HERO_PADDING, HERO_RINGS, HERO_SHAPES } from '../lib/hero-shapes'
import {
  compositionBounds,
  paintOrder,
  projectShape,
  ringBounds,
  VIEW_POINTS,
  type IsoPoint,
} from '../lib/iso-shapes'
import type { Topic } from '../lib/topics'
import { ColorProbes, observeTheme, readProbeColor } from './ColorProbes'

export interface TopicShapeProps {
  topic: Topic
  text: string
  isMirrored?: boolean
  className?: string
}

interface CanvasPoint {
  x: number
  y: number
}

const PROBES = {
  line: 'text-glyph-strong',
  fill: 'text-background',
} as const

const GUIDES_LEAD_MS = 340
const PIECE_DELAY_MS = 105
const PIECE_DRAW_MS = 850

const trimPath = (points: CanvasPoint[], fraction: number): CanvasPoint[] => {
  if (fraction >= 1) return points
  const lengths = points
    .slice(1)
    .map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y))
  let rest = lengths.reduce((sum, length) => sum + length, 0) * fraction
  const trimmed = [points[0]]
  for (let index = 0; index < lengths.length && rest > 0; index++) {
    const share = lengths[index] ? Math.min(rest / lengths[index], 1) : 1
    const [from, to] = [points[index], points[index + 1]]
    trimmed.push({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share })
    rest -= lengths[index]
  }
  return trimmed
}

// faces paint back to front and fill with the page color, so a near face hides the lines behind it
export const TopicShape = ({ topic, text, isMirrored, className }: TopicShapeProps) => {
  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const ctx = canvas?.getContext('2d')
      const probeRoot = canvas?.nextElementSibling
      if (!canvas || !ctx || !(probeRoot instanceof HTMLElement)) return
      const pieces = paintOrder(HERO_SHAPES[topic]).map((box) => projectShape({ box }))
      const rings = (HERO_RINGS[topic] ?? []).map((ring) => {
        const [cx, cy] = VIEW_POINTS.iso(ring.x, ring.y, ring.z)
        return { ...ring, cx, cy }
      })
      const bounds = compositionBounds(
        [...pieces, ...ringBounds({ rings })],
        HERO_PADDING[topic] ?? 0
      )
      const dashedRings = rings.filter((ring) => ring.isDashed)
      const solidRings = rings.filter((ring) => !ring.isDashed)
      const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
      const startedAt = performance.now()
      const orbitsAt = GUIDES_LEAD_MS + (solidRings.length + pieces.length) * PIECE_DELAY_MS
      let frame = 0

      const draw = () => {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        const elapsed = isReducedMotion ? Infinity : performance.now() - startedAt
        const drawnAt = (order: number) =>
          easeInOutCubic(
            clamp((elapsed - GUIDES_LEAD_MS - order * PIECE_DELAY_MS) / PIECE_DRAW_MS, 0, 1)
          )
        // the drawing fits the canvas and sits in its middle, like an svg viewBox
        const fit = Math.min(width / bounds.width, height / bounds.height)
        const left = (width - bounds.width * fit) / 2
        const top = (height - bounds.height * fit) / 2
        const toCanvas = ([x, y]: IsoPoint): CanvasPoint => {
          const fromLeft = (x - bounds.x) * fit
          return {
            x: left + (isMirrored ? bounds.width * fit - fromLeft : fromLeft),
            y: top + (y - bounds.y) * fit,
          }
        }

        ctx.clearRect(0, 0, width, height)
        const fillColor = readProbeColor(probeRoot, 'fill')
        const lineColor = toOpaque(readProbeColor(probeRoot, 'line'), fillColor)
        ctx.font = GLYPH_FONT
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        // each line starts at a different place in the text, so neighbor lines do not repeat
        let offset = 0
        // a closed path repeats its start point, so the trim also covers the last side
        const fillGlyphs = (points: CanvasPoint[], drawn: number, isClosed = false) => {
          ctx.fillStyle = lineColor
          fillGlyphPath({
            ctx,
            points: trimPath(isClosed ? [...points, points[0]] : points, drawn),
            isClosed: false,
            text,
            offset,
            surface: fillColor,
          })
          offset += 1009
        }
        const fillInside = (points: CanvasPoint[]) => {
          ctx.beginPath()
          for (const { x, y } of points) ctx.lineTo(x, y)
          ctx.closePath()
          ctx.fillStyle = fillColor
          ctx.fill()
        }

        const ringPoints = (ring: (typeof rings)[number]) => {
          const center = toCanvas([ring.cx, ring.cy])
          return circlePoints({ cx: center.x, cy: center.y, radius: ring.radius * fit })
        }

        // the dashed orbits paint first, so the solid rings hide them where they cross
        const orbitFade = clamp((elapsed - orbitsAt) / 450, 0, 1)
        ctx.globalAlpha = 1 - (1 - orbitFade) ** 2
        for (const ring of dashedRings) fillGlyphs(ringPoints(ring), 1)
        ctx.globalAlpha = 1
        solidRings.forEach((ring, index) => {
          const points = ringPoints(ring)
          fillInside(points)
          fillGlyphs(points, drawnAt(index))
        })
        pieces.forEach((piece, index) => {
          for (const polygon of [...piece.faces, ...piece.insets]) {
            const points = polygon.map(toCanvas)
            fillInside(points)
            fillGlyphs(points, drawnAt(solidRings.length + index), true)
          }
        })

        if (elapsed < orbitsAt + PIECE_DRAW_MS) frame = requestAnimationFrame(draw)
      }

      const redraw = () => {
        cancelAnimationFrame(frame)
        draw()
      }

      const resize = () => {
        sizeLayers({ contexts: [ctx], width: canvas.clientWidth, height: canvas.clientHeight })
        redraw()
      }

      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
      // a pinch zoom changes only the visual viewport scale, so the canvas redraws for it too
      visualViewport?.addEventListener('resize', resize)
      const unobserveTheme = observeTheme(redraw)
      return () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visualViewport?.removeEventListener('resize', resize)
        unobserveTheme()
      }
    },
    [topic, text, isMirrored]
  )

  return (
    <div aria-hidden className={cn(isMirrored && '-scale-x-100', className)}>
      <canvas ref={setupCanvas} className={cn('block size-full', isMirrored && '-scale-x-100')} />
      <ColorProbes probes={PROBES} />
    </div>
  )
}
