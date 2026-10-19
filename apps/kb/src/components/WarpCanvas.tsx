import { useCallback, type RefObject } from 'react'
import { cn } from 'ui'

import {
  BEAM_ALPHA,
  clamp,
  drawStep,
  GLYPH_PITCH,
  hash,
  isBeamAt,
  phase,
  rampGlyph,
  type PixelRect,
} from '../lib/ascii/field'
import { createGrainPattern, punchGrain } from '../lib/ascii/grain'
import { createLayer } from '../lib/ascii/layer'
import {
  easeInOutCubic,
  easeOutCubic,
  frontRadius,
  isBehindWall,
  locateCell,
  projectWarp,
  ringRadii,
  type WarpCell,
  type WarpPoint,
  type WarpShape,
} from '../lib/ascii/warp'
import { ColorProbes, readProbeColor } from './ColorProbes'

export interface WarpCanvasProps {
  anchorRef: RefObject<HTMLElement | null>
  className?: string
}

interface StrokePolylineParams {
  ctx: CanvasRenderingContext2D
  points: WarpPoint[]
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
  project: (r: number, angle: number) => WarpPoint
}

interface CellGlyphsParams {
  ring: number
  spoke: number
  strength: number
  radii: number[]
  project: (r: number, angle: number) => WarpPoint
}

interface PlacedGlyph extends WarpPoint {
  glyph: string
  isBeam: boolean
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
  beam: string
}

const PROBES = {
  line: 'text-border-muted',
  glyph: 'text-foreground-lighter',
  beam: 'text-brand',
} as const

const THROAT_RADIUS = 150
const ANCHOR_MARGIN = 24
const RING_ANGLES = Array.from({ length: 160 }, (_, k) => (k / 160) * Math.PI * 2)
const SPOKE_ANGLES = Array.from({ length: 32 }, (_, s) => (s / 32) * Math.PI * 2)
const SAMPLES_PER_CELL = RING_ANGLES.length / SPOKE_ANGLES.length
const SPOKE_STEPS = 6
const MAX_FLATTEN = 0.15
const EXPAND_STEPS = 60
const FRONT_ARC_ANGLES = Array.from({ length: 81 }, (_, k) => (k / 80) * Math.PI)
const TOP_FADE = 80

const SPAWN_MIN_RING = 5
const FADE_IN_S = 0.3
const CELL_PADDING = 0.18

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
}: CellOutlineParams): WarpPoint[] | null => {
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
  const rows = Math.max(1, Math.floor(height / 14))

  const glyphs: PlacedGlyph[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellCol = spoke * cols + col
      const cellRow = ring * rows + row
      const glyph = rampGlyph(strength * hash(cellCol, cellRow))
      if (glyph === ' ') continue
      const r = rInner + ((rOuter - rInner) * (row + 0.5)) / rows
      const angle = aStart + ((aEnd - aStart) * (col + 0.5)) / cols
      const isBeam = isBeamAt({ col: cellCol, row: cellRow })
      glyphs.push({ glyph, isBeam, ...project(r, angle) })
    }
  }
  return glyphs
}

const distance = (a: WarpPoint, b: WarpPoint) => Math.hypot(a.x - b.x, a.y - b.y)

const readPalette = (probeRoot: HTMLElement): Palette => {
  const read = (role: keyof typeof PROBES) => readProbeColor(probeRoot, role)
  return {
    line: read('line'),
    glyph: read('glyph'),
    beam: read('beam'),
  }
}

export const WarpCanvas = ({ anchorRef, className }: WarpCanvasProps) => {
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    const host = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    const probeRoot = canvas?.nextElementSibling
    const gridLayer = createLayer()
    if (!canvas || !host || !ctx || !gridLayer || !(probeRoot instanceof HTMLElement)) return
    const grid = gridLayer.ctx

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const revealStartedAt = performance.now()
    const revealAt = (now: number) =>
      isReducedMotion ? 1 : Math.min(1, (now - revealStartedAt) / 1000)
    const grain = createGrainPattern(grid)
    let palette = readPalette(probeRoot)
    let baseShape: WarpShape = { cx: 0, rimY: 0, throatY: 0, r0: THROAT_RADIUS }
    let baseRadii: number[] = []
    let expandStep = -1
    let shape = baseShape
    let radii: number[] = []
    let spokeRadii: number[] = []
    let ringVisible: boolean[][] = []
    let spokeVisible: boolean[][] = []
    let anchorBox: PixelRect | null = null
    let boundaryRing = -1
    let boundaryY = 0
    let pulses: Pulse[] = []
    let hovered: WarpCell | null = null
    let isVisible = false
    let frame = 0
    let lastTime = 0
    let lastSpawn = 0
    let isAnchorObserved = false
    // the rings and spokes change only with scroll, size and theme, so frames reuse this layer
    let gridKey = ''

    const topFade = ctx.createLinearGradient(0, 0, 0, TOP_FADE)
    topFade.addColorStop(0, 'rgb(0 0 0 / 1)')
    topFade.addColorStop(1, 'rgb(0 0 0 / 0)')

    const isRunning = () => isVisible && document.visibilityState === 'visible'

    const getScrollProgress = () => {
      const rect = host.getBoundingClientRect()
      return clamp(-rect.top / rect.height, 0, 1)
    }

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const progress = getScrollProgress()
      const step = Math.round(easeOutCubic(progress) * EXPAND_STEPS)
      if (step !== expandStep) {
        expandStep = step
        const grow = (THROAT_RADIUS * 0.65 * step) / EXPAND_STEPS
        shape = { ...baseShape, r0: baseShape.r0 + grow }
        const edge = baseRadii[boundaryRing]
        const edgeGrow = boundaryRing > 0 ? frontRadius({ shape, y: boundaryY }) - edge : grow
        radii = baseRadii.map((r, i) =>
          i < boundaryRing
            ? r + grow + ((edgeGrow - grow) * (r - THROAT_RADIUS)) / (edge - THROAT_RADIUS)
            : r + edgeGrow
        )
        spokeRadii = subdivide(radii)
        const isShown = (r: number, angle: number) => !isBehindWall({ shape, radii, r, angle })
        ringVisible = radii.map((r) => RING_ANGLES.map((angle) => isShown(r, angle)))
        spokeVisible = SPOKE_ANGLES.map((angle) => spokeRadii.map((r) => isShown(r, angle)))
      }
      const flatten = MAX_FLATTEN * easeInOutCubic(progress)
      const lineY = height - 1.5
      const project = (r: number, angle: number) => projectWarp({ shape, r, angle, flatten, lineY })
      const clipToBoundary = (target: CanvasRenderingContext2D) => {
        if (boundaryRing < 0) return
        const span = Math.max(width, height) * 4
        target.beginPath()
        target.moveTo(-span, -span)
        target.lineTo(span, -span)
        for (const angle of FRONT_ARC_ANGLES) {
          const { x, y } = project(radii[boundaryRing], angle)
          target.lineTo(x, y + 1)
        }
        target.closePath()
        target.clip()
      }

      const t = revealAt(performance.now())
      const across = drawStep(phase({ t, start: 0, length: 0.5 }))
      const down = drawStep(phase({ t, start: 0.25, length: 0.5 }))
      if (gridKey !== `${expandStep}:${flatten}:${across}:${down}`) {
        gridKey = `${expandStep}:${flatten}:${across}:${down}`
        grid.clearRect(0, 0, width, height)
        grid.save()
        clipToBoundary(grid)
        grid.lineWidth = 1
        grid.strokeStyle = palette.line
        // bending pulls the rings past the boundary up to it, so they would show inside the slack
        const ringCount = boundaryRing < 0 ? radii.length : boundaryRing + 1
        grid.save()
        grid.beginPath()
        grid.rect(0, 0, width * across, height)
        grid.clip()
        grid.beginPath()
        radii.slice(0, ringCount).forEach((r, i) => {
          const points = RING_ANGLES.map((angle) => project(r, angle))
          strokePolyline({ ctx: grid, points, visible: ringVisible[i], isClosed: true })
        })
        grid.stroke()
        grid.restore()
        grid.beginPath()
        SPOKE_ANGLES.forEach((angle, s) => {
          const points = spokeRadii
            .slice(0, Math.round(((ringCount - 1) * SPOKE_STEPS + 1) * down))
            .map((r) => project(r, angle))
          strokePolyline({ ctx: grid, points, visible: spokeVisible[s], isClosed: false })
        })
        grid.stroke()
        if (grain) {
          punchGrain({
            ctx: grid,
            pattern: grain,
            rect: { left: 0, top: 0, right: width, bottom: height },
          })
        }
        grid.restore()
      }
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(gridLayer.canvas, 0, 0, width, height)

      ctx.save()
      clipToBoundary(ctx)
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const paintCell = (cell: WarpCell, strength: number) => {
        if (!isCellShown({ ...cell, radii, ringVisible })) return
        const alpha = Math.min(1, strength) * (1 - flatten)
        for (const { glyph, isBeam, x, y } of cellGlyphs({ ...cell, strength, radii, project })) {
          ctx.fillStyle = isBeam ? palette.beam : palette.glyph
          ctx.globalAlpha = alpha * (isBeam ? BEAM_ALPHA : 1)
          ctx.fillText(glyph, x, y)
        }
      }
      for (const pulse of pulses) {
        const fadeIn = Math.min(1, pulse.age / FADE_IN_S)
        const head = Math.floor(pulse.ringPos)
        for (const [offset, strength] of [1, 0.45, 0.18].entries()) {
          const ring = head + offset
          if (ring <= pulse.start) paintCell({ ring, spoke: pulse.spoke }, strength * fadeIn)
        }
      }
      if (hovered) paintCell(hovered, 1)
      ctx.restore()

      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.fillStyle = topFade
      ctx.fillRect(0, 0, width, TOP_FADE)
      ctx.globalCompositeOperation = 'source-over'
    }

    const isPaintable = ({ ring, spoke }: WarpCell, canBeUnderCopy = false) => {
      const outline = cellOutline({
        ring,
        spoke,
        radii,
        ringVisible,
        project: (r, angle) => projectWarp({ shape, r, angle, flatten: 0, lineY: 0 }),
      })
      if (!outline) return false
      const { x, y } = outline[Math.floor(outline.length / 4)]
      const isOffCanvas = x < 0 || x > canvas.clientWidth || y < 0 || y > canvas.clientHeight
      const isUnderCopy =
        anchorBox !== null &&
        x >= anchorBox.left &&
        x <= anchorBox.right &&
        y >= anchorBox.top &&
        y <= anchorBox.bottom
      return !isOffCanvas && (canBeUnderCopy || !isUnderCopy)
    }

    const launch = ({ ring, spoke }: WarpCell, age = 0) => {
      pulses.push({ spoke, start: ring, ringPos: ring + 0.999, age })
    }

    const spawn = () => {
      for (let attempt = 0; attempt < 8; attempt++) {
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
        flatten: MAX_FLATTEN * easeInOutCubic(getScrollProgress()),
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
      if (revealAt(time) >= 0.4 && time - lastSpawn > 450 && pulses.length < 10) {
        lastSpawn = time
        spawn()
      }
      pulses = pulses.flatMap((pulse) => {
        const speed = 2.5 * (1 + 0.25 * (pulse.start - pulse.ringPos))
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
      for (const target of [ctx, grid]) {
        target.canvas.width = Math.round(width * dpr)
        target.canvas.height = Math.round(height * dpr)
        target.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      gridKey = ''

      if (anchorRef.current && !isAnchorObserved) {
        isAnchorObserved = true
        resizeObserver.observe(anchorRef.current)
      }
      const origin = host.getBoundingClientRect()
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
        ?.querySelector('[data-warp-throat]')
        ?.getBoundingClientRect()
      const throatY = throatTarget
        ? (throatTarget.top + throatTarget.bottom) / 2 - origin.top
        : height / 2
      baseShape = { cx: width / 2, rimY: throatY - 190, throatY, r0: THROAT_RADIUS }
      baseRadii = ringRadii({ r0: THROAT_RADIUS, maxRadius: Math.hypot(width, height * 3) })
      const frontYs = baseRadii.map(
        (r) => projectWarp({ shape: baseShape, r, angle: Math.PI / 2, flatten: 0, lineY: 0 }).y
      )
      boundaryRing = frontYs.findLastIndex((y) => y <= height - 2)
      boundaryY = frontYs[boundaryRing] ?? 0
      expandStep = -1
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
      gridKey = ''
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
