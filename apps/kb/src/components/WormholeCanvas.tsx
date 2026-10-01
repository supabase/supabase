import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import { clamp, createRng, GLYPH_PITCH, RAMP, type PixelRect } from '../lib/ascii/field'
import { createGrainPattern, punchGrain } from '../lib/ascii/grain'
import {
  easeInOutCubic,
  isBehindWall,
  locateCell,
  projectWormhole,
  ringRadii,
  type WormholeCell,
  type WormholePoint,
  type WormholeShape,
} from '../lib/ascii/wormhole'
import { ColorProbes, readProbeColor } from './ColorProbes'

export interface WormholeCanvasProps {
  anchorRef: RefObject<HTMLElement | null>
  maxFlatten?: number
  className?: string
}

interface StrokePolylineParams {
  ctx: CanvasRenderingContext2D
  points: WormholePoint[]
  visible: boolean[]
  isClosed: boolean
}

interface CellShownParams {
  ring: number
  spoke: number
  radii: number[]
  ringVisible: boolean[][]
}

interface CellOutlineParams extends CellShownParams {
  project: (r: number, angle: number) => WormholePoint
}

interface CellGlyphsParams {
  ring: number
  spoke: number
  strength: number
  radii: number[]
  project: (r: number, angle: number) => WormholePoint
}

interface PlacedGlyph extends WormholePoint {
  glyph: string
}

interface SmoothstepParams {
  from: number
  to: number
  value: number
}

interface Pulse {
  spoke: number
  start: number
  ringPos: number
  age: number
}

interface Palette {
  line: string
  glyph: string
  rule: string
}

const PROBES = {
  line: 'text-border-muted',
  glyph: 'text-foreground-lighter',
  rule: 'text-border',
} as const

const THROAT_RADIUS = 150
const FUNNEL_DEPTH = 190
const ANCHOR_MARGIN = 24
const RING_ANGLES = Array.from({ length: 160 }, (_, k) => (k / 160) * Math.PI * 2)
const SPOKE_ANGLES = Array.from({ length: 32 }, (_, s) => (s / 32) * Math.PI * 2)
const SAMPLES_PER_CELL = RING_ANGLES.length / SPOKE_ANGLES.length
const SPOKE_STEPS = 6
const FLATTEN_DISTANCE = 0.6
const FUNNEL_FADE_FROM = 0.93
const FUNNEL_FADE_TO = 0.99
const RULE_FADE_FROM = 0.95
const BOUNDARY_MARGIN = 2
const BOUNDARY_SLACK = 1
const FRONT_ARC_ANGLES = Array.from({ length: 81 }, (_, k) => (k / 80) * Math.PI)
const TOP_FADE = 80

const SPAWN_INTERVAL_MS = 450
const MAX_PULSES = 10
const SPAWN_MIN_RING = 5
const SPAWN_ATTEMPTS = 8
const HOP_SPEED = 2.5
const HOP_ACCELERATION = 0.25
const FADE_IN_S = 0.3
const TRAIL = [1, 0.45, 0.18]
const CELL_PADDING = 0.18
const LINE_PITCH = 14
const GAP_CHANCE = 0.15
const FONT = '11px ui-monospace, SFMono-Regular, Menlo, monospace'

const subdivide = (radii: number[]) =>
  radii.flatMap((r, i) => {
    const next = radii[i + 1]
    if (next === undefined) return [r]
    return Array.from({ length: SPOKE_STEPS }, (_, step) => r + ((next - r) * step) / SPOKE_STEPS)
  })

const strokePolyline = ({ ctx, points, visible, isClosed }: StrokePolylineParams) => {
  const count = isClosed ? points.length : points.length - 1
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % points.length
    if (!visible[i] || !visible[next]) continue
    ctx.moveTo(points[i].x, points[i].y)
    ctx.lineTo(points[next].x, points[next].y)
  }
}

const cellSamples = (spoke: number) =>
  Array.from(
    { length: SAMPLES_PER_CELL + 1 },
    (_, step) => (spoke * SAMPLES_PER_CELL + step) % RING_ANGLES.length
  )

const isCellShown = ({ ring, spoke, radii, ringVisible }: CellShownParams) =>
  ring >= 0 &&
  ring + 1 < radii.length &&
  cellSamples(spoke).every((k) => ringVisible[ring][k] && ringVisible[ring + 1][k])

const cellOutline = ({
  ring,
  spoke,
  radii,
  ringVisible,
  project,
}: CellOutlineParams): WormholePoint[] | null => {
  if (!isCellShown({ ring, spoke, radii, ringVisible })) return null
  const samples = cellSamples(spoke)
  const inner = samples.map((k) => project(radii[ring], RING_ANGLES[k]))
  const outer = samples.map((k) => project(radii[ring + 1], RING_ANGLES[k]))
  return [...inner, ...outer.reverse()]
}

const cellGlyphs = ({ ring, spoke, strength, radii, project }: CellGlyphsParams): PlacedGlyph[] => {
  const spokeWidth = (Math.PI * 2) / SPOKE_ANGLES.length
  const rInner = radii[ring] + (radii[ring + 1] - radii[ring]) * CELL_PADDING
  const rOuter = radii[ring + 1] - (radii[ring + 1] - radii[ring]) * CELL_PADDING
  const aStart = SPOKE_ANGLES[spoke] + spokeWidth * CELL_PADDING
  const aEnd = SPOKE_ANGLES[spoke] + spokeWidth * (1 - CELL_PADDING)
  const rMid = (rInner + rOuter) / 2
  const aMid = (aStart + aEnd) / 2
  const width = distance(project(rMid, aStart), project(rMid, aEnd))
  const height = distance(project(rInner, aMid), project(rOuter, aMid))
  const cols = Math.max(1, Math.floor(width / GLYPH_PITCH))
  const rows = Math.max(1, Math.floor(height / LINE_PITCH))
  const rand = createRng(ring * 7919 + spoke * 104729)

  const glyphs: PlacedGlyph[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const noise = rand()
      if (rand() < GAP_CHANCE) continue
      const density = strength * (0.6 + 0.4 * noise)
      const glyph = RAMP[clamp(Math.round(density * 3), 1, 3)]
      const r = rInner + ((rOuter - rInner) * (row + 0.5)) / rows
      const angle = aStart + ((aEnd - aStart) * (col + 0.5)) / cols
      glyphs.push({ glyph, ...project(r, angle) })
    }
  }
  return glyphs
}

const smoothstep = ({ from, to, value }: SmoothstepParams) => {
  const t = clamp((value - from) / (to - from), 0, 1)
  return t * t * (3 - 2 * t)
}

const distance = (a: WormholePoint, b: WormholePoint) => Math.hypot(a.x - b.x, a.y - b.y)

const isInside = ({ box, x, y }: { box: PixelRect; x: number; y: number }) =>
  x >= box.left && x <= box.right && y >= box.top && y <= box.bottom

const readPalette = (probeRoot: HTMLElement): Palette => {
  const read = (role: keyof typeof PROBES) => readProbeColor(probeRoot, role)
  return {
    line: read('line'),
    glyph: read('glyph'),
    rule: read('rule'),
  }
}

export const WormholeCanvas = ({ anchorRef, maxFlatten = 1, className }: WormholeCanvasProps) => {
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    const host = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    const probeRoot = canvas?.nextElementSibling
    if (!canvas || !host || !ctx || !(probeRoot instanceof HTMLElement)) return

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const grain = createGrainPattern(ctx)
    let palette = readPalette(probeRoot)
    let shape: WormholeShape = { cx: 0, rimY: 0, throatY: 0, r0: THROAT_RADIUS }
    let radii: number[] = []
    let spokeRadii: number[] = []
    let ringVisible: boolean[][] = []
    let spokeVisible: boolean[][] = []
    let anchorBox: PixelRect | null = null
    let contentEdges = { left: 0, right: 0 }
    let boundaryRing = -1
    let pulses: Pulse[] = []
    let hovered: WormholeCell | null = null
    let isVisible = false
    let frame = 0
    let lastTime = 0
    let lastSpawn = 0
    let isAnchorObserved = false

    const topFade = ctx.createLinearGradient(0, 0, 0, TOP_FADE)
    topFade.addColorStop(0, 'rgb(0 0 0 / 1)')
    topFade.addColorStop(1, 'rgb(0 0 0 / 0)')

    const isRunning = () => isVisible && document.visibilityState === 'visible'

    const getFlatten = () => {
      const rect = host.getBoundingClientRect()
      const progress = -rect.top / (rect.height * FLATTEN_DISTANCE)
      return maxFlatten * easeInOutCubic(clamp(progress, 0, 1))
    }

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const flatten = getFlatten()
      const lineY = height - 1.5
      const project = (r: number, angle: number) =>
        projectWormhole({ shape, r, angle, flatten, lineY })
      const funnelAlpha =
        1 - smoothstep({ from: FUNNEL_FADE_FROM, to: FUNNEL_FADE_TO, value: flatten })
      const ruleAlpha = smoothstep({ from: RULE_FADE_FROM, to: FUNNEL_FADE_TO, value: flatten })
      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 1

      if (funnelAlpha > 0) {
        ctx.save()
        if (boundaryRing >= 0) {
          const span = Math.max(width, height) * 4
          ctx.beginPath()
          ctx.moveTo(-span, -span)
          ctx.lineTo(span, -span)
          for (const angle of FRONT_ARC_ANGLES) {
            const { x, y } = project(radii[boundaryRing], angle)
            ctx.lineTo(x, y + BOUNDARY_SLACK)
          }
          ctx.closePath()
          ctx.clip()
        }
        ctx.globalAlpha = funnelAlpha
        ctx.strokeStyle = palette.line
        ctx.beginPath()
        radii.forEach((r, i) => {
          const points = RING_ANGLES.map((angle) => project(r, angle))
          strokePolyline({ ctx, points, visible: ringVisible[i], isClosed: true })
        })
        SPOKE_ANGLES.forEach((angle, s) => {
          const points = spokeRadii.map((r) => project(r, angle))
          strokePolyline({ ctx, points, visible: spokeVisible[s], isClosed: false })
        })
        ctx.stroke()
        if (grain) {
          punchGrain({
            ctx,
            pattern: grain,
            rect: { left: 0, top: 0, right: width, bottom: height },
          })
        }

        ctx.font = FONT
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = palette.glyph
        const paintCell = (cell: WormholeCell, strength: number) => {
          if (!isCellShown({ ...cell, radii, ringVisible })) return
          ctx.globalAlpha = Math.min(1, strength) * (1 - flatten) * funnelAlpha
          for (const { glyph, x, y } of cellGlyphs({ ...cell, strength, radii, project })) {
            ctx.fillText(glyph, x, y)
          }
        }
        for (const pulse of pulses) {
          const fadeIn = Math.min(1, pulse.age / FADE_IN_S)
          const head = Math.floor(pulse.ringPos)
          TRAIL.forEach((strength, offset) => {
            const ring = head + offset
            if (ring <= pulse.start) paintCell({ ring, spoke: pulse.spoke }, strength * fadeIn)
          })
        }
        if (hovered) paintCell(hovered, 1)
        ctx.restore()
      }

      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.fillStyle = topFade
      ctx.fillRect(0, 0, width, TOP_FADE)
      ctx.globalCompositeOperation = 'source-over'

      if (ruleAlpha > 0) {
        const { left, right } = contentEdges
        ctx.globalAlpha = ruleAlpha
        ctx.strokeStyle = palette.rule
        ctx.beginPath()
        ctx.moveTo(left, lineY)
        ctx.lineTo(right, lineY)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    const isPaintable = ({ ring, spoke }: WormholeCell, canBeUnderCopy = false) => {
      const outline = cellOutline({
        ring,
        spoke,
        radii,
        ringVisible,
        project: (r, angle) => projectWormhole({ shape, r, angle, flatten: 0, lineY: 0 }),
      })
      if (!outline) return false
      const { x, y } = outline[Math.floor(outline.length / 4)]
      const isOffCanvas = x < 0 || x > canvas.clientWidth || y < 0 || y > canvas.clientHeight
      const isUnderCopy = anchorBox !== null && isInside({ box: anchorBox, x, y })
      return !isOffCanvas && (canBeUnderCopy || !isUnderCopy)
    }

    const launch = ({ ring, spoke }: WormholeCell, age = 0) => {
      pulses.push({ spoke, start: ring, ringPos: ring + 0.999, age })
    }

    const spawn = () => {
      for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
        const cell = {
          ring: SPAWN_MIN_RING + Math.floor(Math.random() * (radii.length - 1 - SPAWN_MIN_RING)),
          spoke: Math.floor(Math.random() * SPOKE_ANGLES.length),
        }
        if (isPaintable(cell)) return launch(cell)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const origin = canvas.getBoundingClientRect()
      const cell = locateCell({
        shape,
        radii,
        spokeCount: SPOKE_ANGLES.length,
        x: event.clientX - origin.left,
        y: event.clientY - origin.top,
        flatten: getFlatten(),
        lineY: canvas.clientHeight - 0.5,
      })
      hovered = cell && isPaintable(cell, true) ? cell : null
      requestDraw()
    }

    const handlePointerLeave = () => {
      hovered = null
      requestDraw()
    }

    const handleClick = () => {
      if (!hovered || isReducedMotion) return
      launch(hovered, FADE_IN_S)
    }

    const tick = (time: number) => {
      frame = 0
      if (!isRunning()) return
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0
      lastTime = time
      if (time - lastSpawn > SPAWN_INTERVAL_MS && pulses.length < MAX_PULSES) {
        lastSpawn = time
        spawn()
      }
      pulses = pulses.flatMap((pulse) => {
        const speed = HOP_SPEED * (1 + HOP_ACCELERATION * (pulse.start - pulse.ringPos))
        const ringPos = pulse.ringPos - speed * dt
        if (ringPos < 0) return []
        return [{ ...pulse, ringPos, age: pulse.age + dt }]
      })
      draw()
      frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (isReducedMotion || frame || !isRunning()) return
      lastTime = 0
      frame = requestAnimationFrame(tick)
    }

    const requestDraw = () => {
      if (!isReducedMotion || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        draw()
      })
    }

    const measure = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (anchorRef.current && !isAnchorObserved) {
        isAnchorObserved = true
        resizeObserver.observe(anchorRef.current)
      }
      const origin = host.getBoundingClientRect()
      const anchor = anchorRef.current?.getBoundingClientRect()
      contentEdges = anchor
        ? { left: anchor.left - origin.left, right: anchor.right - origin.left }
        : { left: 0, right: width }
      const covered = [...(anchorRef.current?.children ?? [])].map((child) =>
        child.getBoundingClientRect()
      )
      anchorBox =
        covered.length > 0
          ? {
              left: Math.min(...covered.map((rect) => rect.left)) - origin.left - ANCHOR_MARGIN,
              top: Math.min(...covered.map((rect) => rect.top)) - origin.top - ANCHOR_MARGIN,
              right: Math.max(...covered.map((rect) => rect.right)) - origin.left + ANCHOR_MARGIN,
              bottom: Math.max(...covered.map((rect) => rect.bottom)) - origin.top + ANCHOR_MARGIN,
            }
          : null
      const throatTarget = anchorRef.current
        ?.querySelector('[data-wormhole-throat]')
        ?.getBoundingClientRect()
      const throatY = throatTarget
        ? (throatTarget.top + throatTarget.bottom) / 2 - origin.top
        : height / 2
      shape = { cx: width / 2, rimY: throatY - FUNNEL_DEPTH, throatY, r0: THROAT_RADIUS }
      radii = ringRadii({ r0: THROAT_RADIUS, maxRadius: Math.hypot(width, height * 3) })
      spokeRadii = subdivide(radii)
      boundaryRing = radii.findLastIndex(
        (r) =>
          projectWormhole({ shape, r, angle: Math.PI / 2, flatten: 0, lineY: 0 }).y <=
          height - BOUNDARY_MARGIN
      )
      const isShown = (r: number, angle: number) => !isBehindWall({ shape, radii, r, angle })
      ringVisible = radii.map((r) => RING_ANGLES.map((angle) => isShown(r, angle)))
      spokeVisible = SPOKE_ANGLES.map((angle) => spokeRadii.map((r) => isShown(r, angle)))
      draw()
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(host)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      wake()
    })
    intersectionObserver.observe(canvas)

    const themeObserver = new MutationObserver(() => {
      palette = readPalette(probeRoot)
      draw()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    window.addEventListener('scroll', requestDraw, { passive: true })
    host.addEventListener('pointermove', handlePointerMove)
    host.addEventListener('pointerleave', handlePointerLeave)
    host.addEventListener('click', handleClick)
    document.addEventListener('visibilitychange', wake)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('scroll', requestDraw)
      host.removeEventListener('pointermove', handlePointerMove)
      host.removeEventListener('pointerleave', handlePointerLeave)
      host.removeEventListener('click', handleClick)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

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
