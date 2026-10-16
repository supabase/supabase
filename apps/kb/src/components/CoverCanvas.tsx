import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import { CELL_HEIGHT, CELL_WIDTH, clamp, fitEdges, RAMP, uniformEdges } from '../lib/ascii/field'
import { createGrainPattern, punchGrain } from '../lib/ascii/grain'
import {
  compositionBounds,
  convexHull,
  paintOrder,
  projectShape,
  VIEW_POINTS,
  type IsoBox,
  type IsoPoint,
  type IsoRing,
  type IsoView,
} from '../lib/iso-shapes'
import { ColorProbes, readProbeColor } from './ColorProbes'

export interface CoverCanvasProps {
  boxes: IsoBox[]
  view?: IsoView
  rings?: IsoRing[]
  // the drawing fits above this element
  keepOutRef?: RefObject<HTMLElement | null>
  className?: string
}

export const CoverCanvas = ({
  boxes,
  view = 'iso',
  rings = NO_RINGS,
  keepOutRef,
  className,
}: CoverCanvasProps) => {
  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const host = canvas?.parentElement
      const ctx = canvas?.getContext('2d')
      const probeRoot = canvas?.nextElementSibling
      if (!canvas || !host || !ctx || !(probeRoot instanceof HTMLElement)) return

      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const sorted = paintOrder(boxes)
      const lifts = sorted.map(() => ({ from: 0, to: 0, startedAt: 0, delay: 0 }))
      const grain = createGrainPattern(ctx)
      const brushMask = createLayer()
      const tableLayer = createLayer()
      // the fluid paints after the grain so the grain's holes stay on the lines only
      const fluidLayer = createLayer()
      let palette = readPalette(probeRoot, host)
      let fit = { scale: 1, x: 0, y: 0 }
      let hovered = -1
      // the box that holds the fluid. it keeps the fluid after hover ends, so the fill drains
      let filled = -1
      let fill = { from: 0, to: 0, startedAt: 0 }
      // eases in when the pointer enters the card and out when it leaves. it controls the orbit
      let cardHover = { from: 0, to: 0, startedAt: 0 }
      const hasOrbit = rings.some((ring) => ring.isDashed)
      let table = { xs: [0], ys: [0] }
      let lastBrushPoint: Point | null = null
      let lastPaintAt = -Infinity
      let frame = 0

      const groundZ = Math.min(...sorted.map((box) => box.z))
      const toPixel = ([x, y]: IsoPoint): IsoPoint => [x * fit.scale + fit.x, y * fit.scale + fit.y]
      const liftAt = (index: number, now: number) => {
        const { from, to, startedAt, delay } = lifts[index]
        const t = isReducedMotion ? 1 : clamp((now - startedAt - delay) / LIFT_MS, 0, 1)
        return from + (to - from) * easeOutQuart(t)
      }
      const fillAt = (now: number) => {
        const t = isReducedMotion ? 1 : clamp((now - fill.startedAt) / LIFT_MS, 0, 1)
        return fill.from + (fill.to - fill.from) * easeOutQuart(t)
      }
      const cardHoverAt = (now: number) => {
        const t = isReducedMotion ? 1 : clamp((now - cardHover.startedAt) / CARD_HOVER_MS, 0, 1)
        return cardHover.from + (cardHover.to - cardHover.from) * easeInOutCubic(t)
      }
      const isLifting = (now: number) =>
        lifts.some(
          ({ from, to, startedAt, delay }) => from !== to && now - startedAt - delay < LIFT_MS
        )

      const isWet = () => performance.now() - lastPaintAt < BRUSH_LIFETIME_MS

      const draw = () => {
        const now = performance.now()
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        ctx.clearRect(0, 0, width, height)
        fluidLayer?.ctx.clearRect(0, 0, width, height)
        // the table only shows where the brush passed, under the boxes
        if (brushMask && tableLayer && isWet()) {
          const reveal = tableLayer.ctx
          reveal.globalCompositeOperation = 'source-over'
          reveal.clearRect(0, 0, width, height)
          reveal.drawImage(brushMask.canvas, 0, 0, width, height)
          reveal.globalCompositeOperation = 'source-in'
          reveal.strokeStyle = palette.line
          reveal.lineWidth = 1
          reveal.beginPath()
          for (const x of table.xs.slice(1, -1)) {
            reveal.moveTo(Math.round(x) + 0.5, 0)
            reveal.lineTo(Math.round(x) + 0.5, height)
          }
          for (const y of table.ys.slice(1, -1)) {
            reveal.moveTo(0, Math.round(y) + 0.5)
            reveal.lineTo(width, Math.round(y) + 0.5)
          }
          reveal.stroke()
          ctx.drawImage(tableLayer.canvas, 0, 0, width, height)
        }
        // rings go under the boxes. solid rings are filled, so they cover the dashed orbit
        const point = VIEW_POINTS[view]
        const orbitProgress = cardHoverAt(now)
        const circleOf = (ring: IsoRing) => {
          const [cx, cy] = toPixel(point(ring.x, ring.y, ring.z))
          return { cx, cy, radius: ring.radius * fit.scale }
        }
        ctx.lineWidth = 1
        ctx.fillStyle = palette.background
        ctx.strokeStyle = palette.line
        for (const ring of orbitProgress > 0 ? rings.filter((ring) => ring.isDashed) : []) {
          const { cx, cy, radius } = circleOf(ring)
          ctx.save()
          ctx.setLineDash([3.6, 3.6])
          ctx.beginPath()
          ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + orbitProgress * Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
        for (const ring of rings.filter((ring) => !ring.isDashed)) {
          const { cx, cy, radius } = circleOf(ring)
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
        sorted.forEach((box, index) => {
          const lift = liftAt(index, now)
          const { faces, insets, posts } = projectShape({ box: { ...box, z: box.z + lift }, view })
          const polygons = [...faces, ...insets].map((polygon) => polygon.map(toPixel))
          for (const polygon of polygons) {
            tracePolygon(ctx, polygon)
            ctx.fill()
            ctx.stroke()
          }
          if (fluidLayer) {
            const silhouette = convexHull(faces.flat()).map(toPixel)
            // a box in front erases the fluid behind it, then draws its own fluid
            const fluid = fluidLayer.ctx
            fluid.save()
            fluid.globalCompositeOperation = 'destination-out'
            tracePolygon(fluid, silhouette)
            fluid.fill()
            fluid.restore()
            drawFluid({
              ctx: fluid,
              silhouette,
              level: index === filled ? fillAt(now) : 0,
              // reduced motion keeps the fill but stills the bubbles
              now: isReducedMotion ? 0 : now,
              color: palette.fluid,
              beam: palette.beam,
            })
          }
          if (lift <= 0) return
          // dotted posts show where the box was before it lifted
          ctx.save()
          ctx.setLineDash([1, 3])
          ctx.beginPath()
          for (const [px, py] of posts) {
            const [fromX, fromY] = toPixel(point(px, py, box.z))
            const [toX, toY] = toPixel(point(px, py, box.z + lift))
            ctx.moveTo(fromX, fromY)
            ctx.lineTo(toX, toY)
          }
          ctx.stroke()
          ctx.restore()
        })
        if (grain)
          punchGrain({
            ctx,
            pattern: grain,
            rect: { left: 0, top: 0, right: width, bottom: height },
          })
        if (fluidLayer) ctx.drawImage(fluidLayer.canvas, 0, 0, width, height)
      }

      const tick = () => {
        frame = 0
        draw()
        if (brushMask && isWet()) {
          brushMask.ctx.globalCompositeOperation = 'destination-out'
          brushMask.ctx.fillStyle = `rgb(0 0 0 / ${BRUSH_FADE})`
          brushMask.ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
        }
        const now = performance.now()
        const isEasing =
          cardHover.from !== cardHover.to && now - cardHover.startedAt < CARD_HOVER_MS
        const isFilling = fill.from !== fill.to && now - fill.startedAt < LIFT_MS
        const isBubbling = !isReducedMotion && fill.to > 0
        if (isLifting(now) || isEasing || isFilling || isBubbling || isWet()) {
          frame = requestAnimationFrame(tick)
        }
      }

      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick)
      }

      const measure = () => {
        const width = host.clientWidth
        const height = host.clientHeight
        const dpr = window.devicePixelRatio || 1
        for (const target of [{ canvas, ctx }, brushMask, tableLayer, fluidLayer]) {
          if (!target) continue
          target.canvas.width = Math.round(width * dpr)
          target.canvas.height = Math.round(height * dpr)
          target.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        table = {
          xs: fitEdges({ size: width, target: CELL_WIDTH }),
          ys: uniformEdges({ size: height, step: CELL_HEIGHT }),
        }
        const keepOut = keepOutRef?.current
        const areaBottom = keepOut
          ? keepOut.getBoundingClientRect().top - canvas.getBoundingClientRect().top
          : height
        // fit the lifted pose too so a raised box never clips the top edge
        const poses = sorted
          .flatMap((box) => [box, { ...box, z: box.z + LIFT }])
          .map((box) => projectShape({ box, view }))
        // rings frame the scene themselves, so they need less padding than bare boxes
        const ringBounds = rings.map((ring) => {
          const [cx, cy] = VIEW_POINTS[view](ring.x, ring.y, ring.z)
          return {
            faces: [
              [
                [cx - ring.radius, cy - ring.radius],
                [cx + ring.radius, cy + ring.radius],
              ] satisfies IsoPoint[],
            ],
          }
        })
        const bounds = compositionBounds([...poses, ...ringBounds], rings.length > 0 ? 0.06 : 0.25)
        const scale = Math.max(0, Math.min(width / bounds.width, areaBottom / bounds.height))
        fit = {
          scale,
          x: (width - bounds.width * scale) / 2 - bounds.x * scale,
          y: (areaBottom - bounds.height * scale) / 2 - bounds.y * scale,
        }
        draw()
      }

      // hit-tests the resting pose, so a box that lifts away from the pointer stays hovered
      const boxAt = (point: Point) => {
        for (let index = sorted.length - 1; index >= 0; index--) {
          const { faces } = projectShape({ box: sorted[index], view })
          if (faces.some((face) => isInside(point, face.map(toPixel)))) return index
        }
        return -1
      }

      const hover = (next: number) => {
        if (next === hovered) return
        hovered = next
        const now = performance.now()
        // a scene with an orbit does not lift. its hover effect is the orbit
        const stack = next < 0 || hasOrbit ? [] : stackFrom(sorted, next)
        // the ground box of a stack does not lift. if it did, the full stack would move
        if (stack.length > 1 && sorted[next].z <= groundZ) stack.length = 0
        // every hovered box fills, the pinned ground box included
        if (next >= 0) filled = next
        fill =
          next >= 0
            ? { from: 0, to: 1, startedAt: now }
            : { from: fillAt(now), to: 0, startedAt: now }
        lifts.forEach((lift, index) => {
          const depth = stack.indexOf(index)
          const to = depth < 0 ? 0 : LIFT
          if (to === lift.to) return
          Object.assign(lift, {
            from: liftAt(index, now),
            to,
            startedAt: now,
            delay: depth < 0 ? 0 : depth * LIFT_STAGGER_MS,
          })
        })
        wake()
      }

      // stamps soft blobs along the pointer path so fast moves still leave a continuous stroke
      const paint = (point: Point) => {
        if (!brushMask || isReducedMotion) return
        const brush = brushMask.ctx
        if (!isWet()) brush.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
        const from = lastBrushPoint ?? point
        const distance = Math.hypot(point.x - from.x, point.y - from.y)
        const steps = Math.max(1, Math.ceil(distance / (BRUSH_RADIUS * BRUSH_SPACING)))
        brush.globalCompositeOperation = 'source-over'
        for (let i = 1; i <= steps; i++) {
          const x = from.x + ((point.x - from.x) * i) / steps
          const y = from.y + ((point.y - from.y) * i) / steps
          const blob = brush.createRadialGradient(x, y, 0, x, y, BRUSH_RADIUS)
          blob.addColorStop(0, 'rgb(0 0 0 / 0.35)')
          blob.addColorStop(1, 'rgb(0 0 0 / 0)')
          brush.fillStyle = blob
          brush.fillRect(x - BRUSH_RADIUS, y - BRUSH_RADIUS, BRUSH_RADIUS * 2, BRUSH_RADIUS * 2)
        }
        lastBrushPoint = point
        lastPaintAt = performance.now()
        wake()
      }

      // the orbit draws in when the pointer enters the card and draws out when it leaves
      const hoverCard = (to: number) => {
        if (cardHover.to === to) return
        const now = performance.now()
        cardHover = { from: cardHoverAt(now), to, startedAt: now }
        wake()
      }

      const handlePointerMove = (event: PointerEvent) => {
        const origin = canvas.getBoundingClientRect()
        const point = { x: event.clientX - origin.left, y: event.clientY - origin.top }
        paint(point)
        hover(boxAt(point))
        hoverCard(1)
      }

      const handlePointerLeave = () => {
        lastBrushPoint = null
        hover(-1)
        hoverCard(0)
      }

      const resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(host)
      if (keepOutRef?.current) resizeObserver.observe(keepOutRef.current)

      const themeObserver = new MutationObserver(() => {
        palette = readPalette(probeRoot, host)
        draw()
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })

      host.addEventListener('pointermove', handlePointerMove)
      host.addEventListener('pointerleave', handlePointerLeave)

      return () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        themeObserver.disconnect()
        host.removeEventListener('pointermove', handlePointerMove)
        host.removeEventListener('pointerleave', handlePointerLeave)
      }
    },
    [boxes, view, rings, keepOutRef]
  )

  return (
    <>
      <canvas
        ref={setupCanvas}
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 size-full', className)}
      />
      <ColorProbes probes={PROBES} />
    </>
  )
}

// a box lifts together with every box stacked on its footprint, lowest first
const stackFrom = (boxes: IsoBox[], index: number): number[] => {
  const base = boxes[index]
  return boxes
    .map((box, i) => ({ box, i }))
    .filter(({ box, i }) => i === index || (box.z >= base.z + base.h - 0.01 && overlaps(box, base)))
    .sort((a, b) => a.box.z - b.box.z)
    .map(({ i }) => i)
}

const overlaps = (a: IsoBox, b: IsoBox) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y

const isInside = ({ x, y }: Point, polygon: IsoPoint[]) => {
  let isIn = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) isIn = !isIn
  }
  return isIn
}

const tracePolygon = (ctx: CanvasRenderingContext2D, polygon: IsoPoint[]) => {
  ctx.beginPath()
  for (const [x, y] of polygon) ctx.lineTo(x, y)
  ctx.closePath()
}

const createLayer = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  return ctx ? { canvas, ctx } : null
}

interface DrawFluidParams {
  ctx: CanvasRenderingContext2D
  silhouette: IsoPoint[]
  // 0 is empty, 1 is full
  level: number
  now: number
  color: string
  // the color a few glyphs briefly glow in
  beam: string
}

// ramp glyphs fill the box from the bottom and move up one row at a time, like bubbles
const drawFluid = ({ ctx, silhouette, level, now, color, beam }: DrawFluidParams) => {
  if (level <= 0) return
  const ys = silhouette.map(([, y]) => y)
  const xs = silhouette.map(([x]) => x)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const bottom = Math.max(...ys)
  const surface = bottom - (bottom - Math.min(...ys)) * level
  const drift = Math.floor(now / FLUID_RISE_MS)
  ctx.save()
  tracePolygon(ctx, silhouette)
  ctx.clip()
  ctx.font = FLUID_FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let row = 0; bottom - row * FLUID_ROW > surface; row++) {
    const y = bottom - row * FLUID_ROW
    // thick at the bottom, thinning toward the surface
    const depth = 1 - (bottom - y) / Math.max(1, bottom - surface)
    for (let col = 0; left + col * FLUID_COLUMN < right; col++) {
      const cell = row - drift
      const density = hash(col, cell) * (0.35 + 0.65 * depth)
      const glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(density * RAMP.length))]
      if (glyph === ' ') continue
      // each glyph uses its own clock offset, so the glows do not pulse together
      const beat = Math.floor(now / FLUID_BEAM_MS + hash(cell, col))
      const isBeam = hash(col + cell * 31, beat) < FLUID_BEAM_CHANCE
      ctx.fillStyle = isBeam ? beam : color
      ctx.globalAlpha = isBeam ? FLUID_BEAM_ALPHA : 1
      ctx.fillText(glyph, left + col * FLUID_COLUMN, y)
    }
  }
  ctx.restore()
}

const hash = (a: number, b: number) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return n - Math.floor(n)
}

const readPalette = (probeRoot: HTMLElement, host: HTMLElement): Palette => {
  const read = (role: keyof typeof PROBES) => readProbeColor(probeRoot, role)
  const hostBackground = getComputedStyle(host).backgroundColor
  return {
    background: hostBackground.endsWith(', 0)') ? read('background') : hostBackground,
    line: read('line'),
    fluid: read('fluid'),
    beam: read('beam'),
  }
}

// close to cubic-bezier(.32,.72,0,1)
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

// close to cubic-bezier(.77,0,.175,1)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const PROBES = {
  line: 'text-border-muted',
  fluid: 'text-foreground-muted',
  beam: 'text-brand',
  background: 'text-background',
} as const

const LIFT = 0.5
const LIFT_MS = 700
const LIFT_STAGGER_MS = 50
const CARD_HOVER_MS = 500
// stable default so the canvas setup isn't redone on every render
const NO_RINGS: IsoRing[] = []
const FLUID_FONT = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
const FLUID_COLUMN = 8
const FLUID_ROW = 10
const FLUID_RISE_MS = 140
const FLUID_BEAM_MS = 600
const FLUID_BEAM_CHANCE = 0.04
const FLUID_BEAM_ALPHA = 0.7
const BRUSH_RADIUS = 56
const BRUSH_SPACING = 0.25
const BRUSH_FADE = 0.04
const BRUSH_LIFETIME_MS = 2000

interface Point {
  x: number
  y: number
}

interface Palette {
  background: string
  line: string
  fluid: string
  beam: string
}
