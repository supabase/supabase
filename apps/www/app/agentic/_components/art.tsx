'use client'

import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react'
import { cn } from 'ui'
import { toOpaque } from 'ui-patterns/GlyphLines'

import { EVENTS_PER_LAP, LAP_MS, LIFECYCLE_STAGES, type LifecycleClock } from './lifecycle'

// The knowledge base's drawing language: faint construction drawings, with lines made of very small
// text. Faces fill with the surface color, so a near face hides the lines behind it.

export type Point = { x: number; y: number }
export type Point3 = [number, number, number]
type Box = { x: number; y: number; z: number; w: number; d: number; h: number }

export type IsoDrawing = {
  /** Painted in order, so list them back to front. */
  boxes: Box[]
  /** A closed shape on one of the faces, drawn last and filled with glyphs in the accent color. */
  mark?: Point3[]
}

type Stroke = {
  points: Point[]
  startsAt: number
  duration: number
  /** Fills the shape with the surface color first, so it hides the lines behind it. */
  isFilled?: boolean
  /** Short lines lose too much to the gaps between words, so these close them up. */
  isSolid?: boolean
  /** Fills the shape with rows of glyphs in the accent color, instead of tracing its edge. */
  isMark?: boolean
}

type Scene = {
  strokes: Stroke[]
  /** How far round a lap a point sits, from 0 to 1. Set this to send a pulse round the scene. */
  lapPosition?: (point: Point) => number
}

type SceneBuilder = (width: number, height: number) => Scene

const COS = Math.cos(Math.PI / 6)
// In CSS px. Glyphs this small read as a line at 100%, and as text once the page is zoomed in.
export const GLYPH_SIZE = 2.2
export const GLYPH_FONT = `${GLYPH_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`
const LEAD_MS = 200
const PIECE_DELAY_MS = 105
const PIECE_DRAW_MS = 850
const RING_DRAW_MS = 2000
const PRONG_DRAW_MS = 200
const PULSE_TRAIL = 0.07

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// The time an eased draw-in takes to reach a fraction of its length
const inverseEase = (fraction: number) =>
  fraction < 0.5 ? Math.cbrt(fraction / 4) : 1 - Math.cbrt((1 - fraction) * 4) / 2

const trimPath = (points: Point[], fraction: number): Point[] => {
  if (fraction >= 1) return points
  const lengths = points
    .slice(1)
    .map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y))
  let rest = lengths.reduce((sum, length) => sum + length, 0) * fraction
  const trimmed = [points[0]]
  for (let i = 0; i < lengths.length && rest > 0; i++) {
    const share = Math.min(rest / lengths[i], 1)
    const [from, to] = [points[i], points[i + 1]]
    trimmed.push({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share })
    rest -= lengths[i]
  }
  return trimmed
}

export const glyphsAlong = (points: Point[]): Point[] => {
  const glyphs: Point[] = []
  let carry = 0
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    const length = Math.hypot(dx, dy)
    if (!length) continue
    // An upright glyph box is 0.65 wide and 1 tall, so the step is the box size along the segment
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
  return glyphs
}

type GlyphCanvasProps = {
  /** Becomes the lines. */
  text: string
  /** A panel that isn't open has no need to draw, so it waits for this. */
  playing?: boolean
  /** A `caret-*` class naming the color behind the drawing. */
  surface?: string
  className?: string
}

function GlyphCanvas({
  scene,
  text,
  playing = true,
  surface = 'caret-background',
  className,
  clock,
  onLap,
}: GlyphCanvasProps & {
  scene: SceneBuilder
  /** Where a pulse is on its lap. */
  clock?: LifecycleClock
  /** Called as a pulse travels, with how far round the lap it is, from 0 to 1. */
  onLap?: (lap: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const layer = document.createElement('canvas')
    const layerCtx = layer.getContext('2d')
    if (!playing || !canvas || !ctx || !layerCtx) return

    const glyphText = text.toUpperCase()
    const solidText = glyphText.replace(/ /g, '')
    const isReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const startedAt = performance.now()
    let ratio = 1
    let strokes: Stroke[] = []
    let drawnAt = 0
    let pulseGlyphs: (Point & { char: string; lap: number })[] = []
    let isLayerReady = false
    let frame = 0

    const charAt = (strokeIndex: number, glyphIndex: number) => {
      const source = strokes[strokeIndex].isSolid ? solidText : glyphText
      // Each line starts at a different place in the text, so neighbor lines don't repeat
      return source[(strokeIndex * 1009 + glyphIndex) % source.length]
    }

    const paint = (elapsed: number) => {
      const { color, caretColor, accentColor } = getComputedStyle(canvas)
      const line = toOpaque(color, caretColor)
      const accent = toOpaque(accentColor, caretColor)
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      strokes.forEach(({ points, startsAt, duration, isFilled, isMark }, strokeIndex) => {
        if (isFilled) {
          ctx.beginPath()
          for (const { x, y } of points) ctx.lineTo(x, y)
          ctx.closePath()
          ctx.fillStyle = caretColor
          ctx.fill()
        }
        const progress = easeInOutCubic(Math.min(Math.max((elapsed - startsAt) / duration, 0), 1))
        if (!progress) return
        if (isMark) {
          const xs = points.map(({ x }) => x)
          const ys = points.map(({ y }) => y)
          ctx.save()
          ctx.beginPath()
          for (const { x, y } of points) ctx.lineTo(x, y)
          ctx.closePath()
          ctx.clip()
          ctx.fillStyle = accent
          ctx.globalAlpha = progress
          let i = 0
          for (let y = Math.min(...ys); y < Math.max(...ys); y += GLYPH_SIZE) {
            for (let x = Math.min(...xs); x < Math.max(...xs); x += GLYPH_SIZE * 0.65) {
              ctx.fillText(charAt(strokeIndex, i++), x, y)
            }
          }
          ctx.restore()
          return
        }
        const glyphs = glyphsAlong(trimPath(points, progress))
        // The cells of one line only touch, so the line draws all its cells before its glyphs
        ctx.beginPath()
        for (const { x, y } of glyphs) {
          ctx.rect(x - GLYPH_SIZE * 0.325, y - GLYPH_SIZE * 0.5, GLYPH_SIZE * 0.65, GLYPH_SIZE)
        }
        ctx.fillStyle = caretColor
        ctx.fill()
        ctx.fillStyle = line
        glyphs.forEach(({ x, y }, i) => ctx.fillText(charAt(strokeIndex, i), x, y))
      })
    }

    const paintPulse = () => {
      const { accentColor, caretColor } = getComputedStyle(canvas)
      const head = ((clock?.read() ?? 0) % LAP_MS) / LAP_MS
      onLap?.(head)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(layer, 0, 0)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.fillStyle = toOpaque(accentColor, caretColor)
      for (const { x, y, char, lap } of pulseGlyphs) {
        const behind = (head - lap + 1) % 1
        if (behind > PULSE_TRAIL) continue
        ctx.globalAlpha = (1 - behind / PULSE_TRAIL) ** 2
        ctx.fillText(char, x, y)
      }
      ctx.globalAlpha = 1
    }

    const tick = () => {
      const elapsed = isReducedMotion ? Infinity : performance.now() - startedAt
      if (elapsed < drawnAt) {
        paint(elapsed)
        frame = requestAnimationFrame(tick)
        return
      }
      if (!isLayerReady) {
        paint(Infinity)
        layerCtx.clearRect(0, 0, layer.width, layer.height)
        layerCtx.drawImage(canvas, 0, 0)
        isLayerReady = true
      }
      if (!pulseGlyphs.length || isReducedMotion) return
      const box = canvas.getBoundingClientRect()
      if (box.bottom > 0 && box.top < innerHeight) paintPulse()
      frame = requestAnimationFrame(tick)
    }

    const restart = () => {
      cancelAnimationFrame(frame)
      isLayerReady = false
      tick()
    }

    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      // A pinch zoom changes the visual viewport scale, not the device pixel ratio. Safari blanks
      // a canvas past about 16M px, so a deep zoom caps the resolution.
      ratio = Math.min(
        devicePixelRatio * (visualViewport?.scale ?? 1),
        Math.sqrt(16_000_000 / (width * height))
      )
      for (const target of [canvas, layer]) {
        target.width = Math.round(width * ratio)
        target.height = Math.round(height * ratio)
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.font = GLYPH_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const { strokes: built, lapPosition } = scene(width, height)
      strokes = built
      drawnAt = Math.max(...strokes.map(({ startsAt, duration }) => startsAt + duration))
      pulseGlyphs = lapPosition
        ? strokes.flatMap(({ points }, strokeIndex) =>
            glyphsAlong(points).map((glyph, i) => ({
              ...glyph,
              char: charAt(strokeIndex, i),
              lap: lapPosition(glyph),
            }))
          )
        : []
      restart()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    visualViewport?.addEventListener('resize', resize)
    const themeObserver = new MutationObserver(restart)
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
  }, [scene, text, playing, clock, onLap])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('block w-full text-foreground-muted accent-brand-600', surface, className)}
    />
  )
}

export const project = ([x, y, z]: Point3): Point => ({
  x: (x - y) * COS,
  y: (x + y) * 0.5 - z,
})

const boxFaces = ({ x, y, z, w, d, h }: Box): Point3[][] => [
  [
    [x + w, y, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x + w, y, z + h],
  ],
  [
    [x, y + d, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ],
  [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ],
]

const isoScene =
  ({ boxes, mark }: IsoDrawing): SceneBuilder =>
  (width, height) => {
    const pieces = boxes.map((box) => boxFaces(box).map((face) => face.map(project)))
    const all = pieces.flat(2)
    const left = Math.min(...all.map(({ x }) => x))
    const top = Math.min(...all.map(({ y }) => y))
    const unitWidth = Math.max(...all.map(({ x }) => x)) - left
    const unitHeight = Math.max(...all.map(({ y }) => y)) - top
    // The drawing fits the canvas and sits in its middle, like an SVG viewBox
    const fit = Math.min(width / unitWidth, height / unitHeight)
    const offsetX = (width - unitWidth * fit) / 2
    const offsetY = (height - unitHeight * fit) / 2
    const toCanvas = ({ x, y }: Point): Point => ({
      x: offsetX + (x - left) * fit,
      y: offsetY + (y - top) * fit,
    })
    const closed = (points: Point[]) => [...points, points[0]].map(toCanvas)
    const startsAt = (index: number) => LEAD_MS + index * PIECE_DELAY_MS
    return {
      strokes: [
        ...pieces.flatMap((faces, index) =>
          faces.map((face) => ({
            points: closed(face),
            startsAt: startsAt(index),
            duration: PIECE_DRAW_MS,
            isFilled: true,
          }))
        ),
        ...(mark
          ? [
              {
                points: closed(mark.map(project)),
                startsAt: startsAt(pieces.length),
                duration: PIECE_DRAW_MS,
                isMark: true,
              },
            ]
          : []),
      ],
    }
  }

export function IsoArt({ drawing, ...props }: GlyphCanvasProps & { drawing: IsoDrawing }) {
  const scene = useMemo(() => isoScene(drawing), [drawing])
  return <GlyphCanvas scene={scene} {...props} />
}

// A long prong for every life cycle event, and a longer one where each stage starts
const PRONGS = 108
const EVENT_PRONG_EVERY = PRONGS / EVENTS_PER_LAP
const STAGE_PRONG_EVERY = PRONGS / LIFECYCLE_STAGES.length

const getProngLength = (index: number) => {
  if (index % STAGE_PRONG_EVERY === 0) return 0.09
  if (index % EVENT_PRONG_EVERY === 0) return 0.065
  return 0.035
}

// How far from the ring's center its stage labels sit, as a share of its radius
const STAGE_LABEL_REACH = 0.84

// In the middle of the stage's arc, which also keeps it clear of the copy inside the ring
const getStageLabelPosition = (index: number) => {
  const angle = ((index + 0.5) / LIFECYCLE_STAGES.length) * Math.PI * 2
  // Rounded, because the server and browser can differ in the last digits of a sine
  const toPercent = (share: number) => `${Math.round((50 + share * 50) * 100) / 100}%`
  return {
    left: toPercent(Math.sin(angle) * STAGE_LABEL_REACH),
    top: toPercent(-Math.cos(angle) * STAGE_LABEL_REACH),
  }
}

// Starts at the top and runs clockwise, like a clock
const onRing = (cx: number, cy: number, radius: number, lap: number): Point => {
  const angle = (lap - 0.25) * Math.PI * 2
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
}

const ringScene: SceneBuilder = (width, height) => {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - GLYPH_SIZE
  return {
    strokes: [
      {
        points: Array.from({ length: 361 }, (_, i) => onRing(cx, cy, radius, i / 360)),
        startsAt: 0,
        duration: RING_DRAW_MS,
      },
      ...Array.from({ length: PRONGS }, (_, i) => {
        const lap = i / PRONGS
        const length = radius * getProngLength(i)
        return {
          points: [onRing(cx, cy, radius, lap), onRing(cx, cy, radius - length, lap)],
          // The ring's draw-in eases, so a prong starts when the ring reaches it
          startsAt: RING_DRAW_MS * inverseEase(lap),
          duration: PRONG_DRAW_MS,
          isSolid: true,
        }
      }),
    ],
    lapPosition: ({ x, y }) => (Math.atan2(y - cy, x - cx) / (Math.PI * 2) + 1.25) % 1,
  }
}

const getPointerAngle = (event: PointerEvent<SVGCircleElement>) => {
  const box = event.currentTarget.getBoundingClientRect()
  return Math.atan2(
    event.clientY - box.top - box.height / 2,
    event.clientX - box.left - box.width / 2
  )
}

/**
 * The project's life cycle running round the page. The current stage's label brightens, and dragging
 * the ring moves the life cycle forward or back.
 */
export function TimelineRing({
  clock,
  className,
  ...props
}: GlyphCanvasProps & { clock: LifecycleClock }) {
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const currentStage = useRef(-1)
  const dragAngle = useRef<number | null>(null)

  const onLap = useCallback((lap: number) => {
    const stage = Math.floor(lap * LIFECYCLE_STAGES.length)
    if (stage === currentStage.current) return
    currentStage.current = stage
    labels.current.forEach((label, index) => {
      label?.classList.toggle('opacity-80', index === stage)
      label?.classList.toggle('opacity-40', index !== stage)
    })
  }, [])

  return (
    <div className={className}>
      <GlyphCanvas scene={ringScene} clock={clock} onLap={onLap} className="size-full" {...props} />
      {/* Phones hide these, because the ring runs off the sides of the page */}
      {LIFECYCLE_STAGES.map((stage, index) => (
        <span
          key={stage}
          ref={(label) => {
            labels.current[index] = label
          }}
          aria-hidden
          // Waits for the ring to finish drawing itself
          style={{ ...getStageLabelPosition(index), animationDelay: '1800ms' }}
          className="absolute hidden -translate-x-1/2 -translate-y-1/2 animate-in fade-in fill-mode-backwards text-xs text-foreground-lighter opacity-40 transition-opacity duration-500 motion-reduce:animate-none motion-reduce:transition-none sm:block"
        >
          {stage}
        </span>
      ))}
      {/* Only the band of the ring can be grabbed. A swipe up or down still scrolls the page. */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full overflow-visible motion-reduce:hidden"
      >
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          className="pointer-events-auto cursor-grab touch-pan-y select-none active:cursor-grabbing"
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.currentTarget.setPointerCapture(event.pointerId)
            dragAngle.current = getPointerAngle(event)
            clock.hold()
          }}
          onPointerMove={(event) => {
            if (dragAngle.current === null) return
            const angle = getPointerAngle(event)
            const turned = angle - dragAngle.current
            // The short way round, so crossing from one side of the angle's range to the other
            // doesn't count as a whole lap
            const shortest = Math.atan2(Math.sin(turned), Math.cos(turned))
            clock.scrub((shortest / (Math.PI * 2)) * LAP_MS)
            dragAngle.current = angle
          }}
          onLostPointerCapture={() => {
            dragAngle.current = null
            clock.release()
          }}
        />
      </svg>
    </div>
  )
}

const cube = (x: number, y: number, z: number, size: number): Box => ({
  x,
  y,
  z,
  w: size,
  d: size,
  h: size,
})

// The logo as one flat shape, in its 109 by 113 viewBox. The two bolts overlap, so this runs round
// the outside of both.
const bezier = (
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [cx, cy]: [number, number],
  [dx, dy]: [number, number]
): [number, number][] =>
  Array.from({ length: 7 }, (_, i) => {
    const t = i / 6
    const u = 1 - t
    return [
      u ** 3 * ax + 3 * u * u * t * bx + 3 * u * t * t * cx + t ** 3 * dx,
      u ** 3 * ay + 3 * u * u * t * by + 3 * u * t * t * cy + t ** 3 * dy,
    ]
  })

const LOGO_OUTLINE: [number, number][] = [
  ...bezier([45.32, 2.07], [48.18, -1.53], [53.97, 0.44], [54.04, 5.04]),
  [54.27, 40.06],
  ...bezier([99.19, 40.06], [107.38, 40.06], [111.95, 49.52], [106.86, 55.94]),
  ...bezier([63.71, 110.28], [60.85, 113.89], [55.05, 111.91], [54.98, 107.31]),
  [54.48, 72.29],
  ...bezier([9.83, 72.29], [1.64, 72.29], [-2.93, 62.83], [2.17, 56.42]),
]

const LOGO_SHARE = 0.56

// On the face that looks down and to the left, where the logo reads the right way round
export const logoOn = ({ x, y, z, w, d, h }: Box): Point3[] =>
  LOGO_OUTLINE.map(([u, v]) => [
    x + w / 2 + ((u - 54.5) / 113) * w * LOGO_SHARE,
    y + d,
    z + h / 2 + ((56.5 - v) / 113) * h * LOGO_SHARE,
  ])

/** Files standing in a row, with the one that changed lifted out of it. */
export const CODE_DRAWING: IsoDrawing = {
  boxes: [0, 0, 0.55, 0].map((z, i) => ({ x: i * 0.7, y: 0, z, w: 0, d: 1.9, h: 2.4 })),
}

/** Every service, on one machine. */
export const LOCAL_STACK_DRAWING: IsoDrawing = {
  boxes: [
    { x: 0, y: 0, z: 0, w: 3.4, d: 2.3, h: 0 },
    ...[
      [0, 0],
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [2, 1],
    ].map(([column, row]) => cube(0.25 + column * 1.05, 0.25 + row * 1.05, 0, 0.75)),
  ],
}

/** A branch leaves main, carries the change, and comes back. */
export const BRANCH_DRAWING: IsoDrawing = {
  boxes: [
    { x: 0, y: 0, z: 0, w: 5.4, d: 0.6, h: 0.32 },
    { x: 1.1, y: 0.2, z: 0.32, w: 0.2, d: 0.2, h: 1.05 },
    { x: 4.1, y: 0.2, z: 0.32, w: 0.2, d: 0.2, h: 1.05 },
    { x: 1, y: 0, z: 1.37, w: 3.4, d: 0.6, h: 0.32 },
  ],
}

/** One table of records, with the one that matters pulled out. */
export const LOGS_DRAWING: IsoDrawing = {
  boxes: Array.from({ length: 5 }, (_, i) => ({
    x: i === 2 ? 1.1 : 0,
    y: 0,
    z: i * 0.5,
    w: 2.6,
    d: 2,
    h: 0.2,
  })),
}

/** Checks across the project, and one that stands out. */
export const ISSUES_DRAWING: IsoDrawing = {
  boxes: Array.from({ length: 9 }, (_, i) => ({ column: i % 3, row: Math.floor(i / 3) }))
    .sort((a, b) => a.column + a.row - (b.column + b.row))
    .map(({ column, row }) => ({
      x: column * 1.15,
      y: row * 1.15,
      z: 0,
      w: 0.9,
      d: 0.9,
      h: column === 2 && row === 1 ? 1.7 : 0,
    })),
}

/** A page with the numbers standing on it. */
export const NOTEBOOKS_DRAWING: IsoDrawing = {
  boxes: [
    { x: 0, y: 0, z: 0, w: 4.1, d: 2, h: 0 },
    ...[1, 1.7, 1.2, 2.2].map((h, i) => ({ x: 0.35 + i * 0.9, y: 0.6, z: 0, w: 0.6, d: 0.8, h })),
  ],
}

const AGENT_CORE = cube(0, 0, 0.3, 1.4)

/** The cube from the top of the page, with the work it takes on around it. */
export const SUPABASE_AGENT_DRAWING: IsoDrawing = {
  boxes: [
    cube(0.5, -2.4, 1.1, 0.4),
    cube(-2.4, 0.5, 0.7, 0.4),
    AGENT_CORE,
    cube(3, 0.5, 0.9, 0.4),
    cube(0.5, 3, 0.1, 0.4),
  ],
  mark: logoOn(AGENT_CORE),
}

/** A podium: agents measured against each other. */
export const EVALS_DRAWING: IsoDrawing = {
  boxes: [1.15, 1.75, 0.7].map((h, i) => ({ x: i, y: 0, z: 0, w: 1, d: 1.3, h })),
}
