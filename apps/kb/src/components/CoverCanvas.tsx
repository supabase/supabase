import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import { CELL_HEIGHT, CELL_WIDTH, clamp, fitEdges, uniformEdges } from '../lib/ascii/field'
import { drawFluid, FLUID_RISE_MS } from '../lib/ascii/fluid'
import { loadGrain, punchGrain } from '../lib/ascii/grain'
import { createLayer, sizeLayers, tracePolygon } from '../lib/ascii/layer'
import { easeInOutCubic } from '../lib/ascii/warp'
import {
  compositionBounds,
  convexHull,
  paintOrder,
  projectShape,
  ringBounds,
  VIEW_POINTS,
  type IsoBox,
  type IsoPoint,
  type IsoRing,
  type IsoView,
} from '../lib/iso-shapes'
import { ColorProbes, observeTheme, readProbeColor } from './ColorProbes'

export interface CoverCanvasProps {
  boxes: IsoBox[]
  view?: IsoView
  rings?: IsoRing[]
  fillBoxes?: IsoBox[]
  nudgeY?: number
  zoom?: number
  keepOutRef?: RefObject<HTMLElement | null>
  className?: string
}

interface Point {
  x: number
  y: number
}

interface Palette {
  line: string
  fluid: string
  beam: string
}

const PROBES = {
  line: 'text-border-muted',
  fluid: 'text-foreground-muted',
  beam: 'text-brand',
} as const

const LIFT = 0.5
const LIFT_MS = 700
const CARD_HOVER_MS = 500
// stable default so the canvas setup isn't redone on every render
const NO_RINGS: IsoRing[] = []

// a box lifts together with every box stacked on its footprint, lowest first
const stackFrom = (boxes: IsoBox[], index: number): number[] => {
  const base = boxes[index]
  return boxes
    .map((box, i) => ({ box, i }))
    .filter(
      ({ box, i }) =>
        i === index ||
        (box.z >= base.z + base.h - 0.01 &&
          box.x < base.x + base.w &&
          box.x + box.w > base.x &&
          box.y < base.y + base.d &&
          box.y + box.d > base.y)
    )
    .sort((a, b) => a.box.z - b.box.z)
    .map(({ i }) => i)
}

const isInside = ({ x, y }: Point, polygon: IsoPoint[]) => {
  let isIn = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) isIn = !isIn
  }
  return isIn
}

const clearPath = (ctx: CanvasRenderingContext2D) => {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.restore()
}

const readPalette = (probeRoot: HTMLElement): Palette => {
  const read = (role: keyof typeof PROBES) => readProbeColor(probeRoot, role)
  return {
    line: read('line'),
    fluid: read('fluid'),
    beam: read('beam'),
  }
}

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

export const CoverCanvas = ({
  boxes,
  view = 'iso',
  rings = NO_RINGS,
  fillBoxes = boxes,
  nudgeY = 0,
  zoom = 1,
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
      let grain: CanvasPattern | null = null
      loadGrain(ctx).then((pattern) => {
        grain = pattern
        draw()
      })
      // the fluid paints after the grain so the grain's holes stay on the lines only
      const fluidLayer = createLayer()
      let palette = readPalette(probeRoot)
      let fit = { scale: 1, x: 0, y: 0 }
      let hovered = -1
      const filled = fillBoxes.map((box) => sorted.indexOf(box))
      let fill = { from: 0, to: 0, startedAt: 0 }
      let cardHover = { from: 0, to: 0, startedAt: 0 }
      const hasOrbit = rings.some((ring) => ring.isDashed)
      let table = { xs: [0], ys: [0] }
      let tableBottom = 0
      let frame = 0
      let wasAnimating = false
      let drawnFluidStep = -1

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

      const draw = () => {
        const now = performance.now()
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        ctx.clearRect(0, 0, width, height)
        fluidLayer?.ctx.clearRect(0, 0, width, height)
        ctx.strokeStyle = palette.line
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const x of table.xs.slice(1, -1)) {
          ctx.moveTo(Math.round(x) + 0.5, 0)
          ctx.lineTo(Math.round(x) + 0.5, Math.round(tableBottom) + 0.5)
        }
        for (const y of table.ys.slice(1, -1).filter((row) => row <= tableBottom)) {
          ctx.moveTo(0, Math.round(y) + 0.5)
          ctx.lineTo(width, Math.round(y) + 0.5)
        }
        ctx.stroke()
        // solid rings clear the canvas inside them, so they cover the dashed orbit
        const point = VIEW_POINTS[view]
        const orbitProgress = cardHoverAt(now)
        const circleOf = (ring: IsoRing) => {
          const [cx, cy] = toPixel(point(ring.x, ring.y, ring.z))
          return { cx, cy, radius: ring.radius * fit.scale - 2 }
        }
        ctx.lineWidth = 1
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
          clearPath(ctx)
          ctx.stroke()
        }
        sorted.forEach((box, index) => {
          const lift = liftAt(index, now)
          const {
            faces,
            insets,
            posts,
            fill: fillArea,
          } = projectShape({
            box: { ...box, z: box.z + lift },
            view,
          })
          const polygons = [...faces, ...insets].map((polygon) => polygon.map(toPixel))
          for (const polygon of polygons) {
            tracePolygon(ctx, polygon)
            clearPath(ctx)
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
              area: fillArea.map(toPixel),
              level: filled.includes(index) ? fillAt(now) : 0,
              // reduced motion keeps the fill but stills the bubbles
              now: isReducedMotion ? 0 : now,
              color: palette.fluid,
              beam: palette.beam,
              flow: box.fillFlow ?? 'up',
            })
          }
          if (lift <= 0) return
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
        if (grain) punchGrain({ ctx, pattern: grain, width, height })
        if (fluidLayer) ctx.drawImage(fluidLayer.canvas, 0, 0, width, height)
      }

      const tick = () => {
        frame = 0
        const now = performance.now()
        const isEasing =
          cardHover.from !== cardHover.to && now - cardHover.startedAt < CARD_HOVER_MS
        const isFilling = fill.from !== fill.to && now - fill.startedAt < LIFT_MS
        const isAnimating = isLifting(now) || isEasing || isFilling
        const isBubbling = !isReducedMotion && fill.to > 0
        // a resting fill changes only when it rises a row. the frame after an animation draws its end state
        const fluidStep = Math.floor(now / FLUID_RISE_MS)
        if (isAnimating || wasAnimating || fluidStep !== drawnFluidStep) {
          drawnFluidStep = fluidStep
          draw()
        }
        wasAnimating = isAnimating
        if (isAnimating || isBubbling) frame = requestAnimationFrame(tick)
      }

      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick)
      }

      const measure = () => {
        const width = host.clientWidth
        const height = host.clientHeight
        sizeLayers({ contexts: fluidLayer ? [ctx, fluidLayer.ctx] : [ctx], width, height })
        table = {
          xs: fitEdges({ size: width, target: CELL_WIDTH }),
          ys: uniformEdges({ size: height, step: CELL_HEIGHT }),
        }
        const keepOut = keepOutRef?.current
        const areaBottom = keepOut
          ? keepOut.getBoundingClientRect().top - canvas.getBoundingClientRect().top
          : height
        tableBottom = table.ys.filter((row) => row < areaBottom - 1).at(-1) ?? areaBottom
        // fit the lifted pose too so a raised box never clips the top edge
        const poses = sorted
          .flatMap((box) => [box, { ...box, z: box.z + LIFT }])
          .map((box) => projectShape({ box, view }))
        // rings frame the scene themselves, so they need less padding than bare boxes
        const bounds = compositionBounds(
          [...poses, ...ringBounds({ rings, view })],
          rings.length > 0 ? 0.06 : 0.25
        )
        const scale = zoom * Math.max(0, Math.min(width / bounds.width, areaBottom / bounds.height))
        fit = {
          scale,
          x: (width - bounds.width * scale) / 2 - bounds.x * scale,
          y: (areaBottom - bounds.height * scale) / 2 - bounds.y * scale - CELL_HEIGHT + nudgeY,
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
        if (stack.length > 0)
          stack.push(...(sorted[next].alsoLifts ?? []).map((box) => sorted.indexOf(box)))
        lifts.forEach((lift, index) => {
          const depth = stack.indexOf(index)
          const to = depth < 0 ? 0 : LIFT
          if (to === lift.to) return
          Object.assign(lift, {
            from: liftAt(index, now),
            to,
            startedAt: now,
            delay: depth < 0 ? 0 : depth * 50,
          })
        })
        wake()
      }

      const hoverCard = (to: number) => {
        if (cardHover.to === to) return
        const now = performance.now()
        cardHover = { from: cardHoverAt(now), to, startedAt: now }
        fill = { from: fillAt(now), to, startedAt: now }
        wake()
      }

      const handlePointerMove = (event: PointerEvent) => {
        const origin = canvas.getBoundingClientRect()
        const point = { x: event.clientX - origin.left, y: event.clientY - origin.top }
        hover(boxAt(point))
        hoverCard(1)
      }

      const handlePointerLeave = () => {
        hover(-1)
        hoverCard(0)
      }

      const resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(host)
      if (keepOutRef?.current) resizeObserver.observe(keepOutRef.current)
      // a pinch zoom changes only the visual viewport scale, so the layers resize for it too
      visualViewport?.addEventListener('resize', measure)

      const unobserveTheme = observeTheme(() => {
        palette = readPalette(probeRoot)
        draw()
      })

      host.addEventListener('pointermove', handlePointerMove)
      host.addEventListener('pointerleave', handlePointerLeave)

      return () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visualViewport?.removeEventListener('resize', measure)
        unobserveTheme()
        host.removeEventListener('pointermove', handlePointerMove)
        host.removeEventListener('pointerleave', handlePointerLeave)
      }
    },
    [boxes, view, rings, fillBoxes, nudgeY, zoom, keepOutRef]
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
