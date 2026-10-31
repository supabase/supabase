import { useId } from 'react'
import { cn } from 'ui'

import {
  compositionBounds,
  paintOrder,
  planCenter,
  projectShape,
  ringBounds,
  turnPoint,
  VIEW_POINTS,
  type IsoBox,
  type IsoPoint,
  type IsoTurn,
} from './IsoShape.geometry'
import { BEAM_ALPHA, hash, isBeamAt, rampGlyph } from './IsoShape.glyphs'
import {
  ISO_SHAPE_FILL_BOXES,
  ISO_SHAPE_PADDING,
  ISO_SHAPE_POSES,
  ISO_SHAPE_RINGS,
  ISO_SHAPE_STILL_BOXES,
  ISO_SHAPE_SWINGS,
  ISO_SHAPES,
  type IsoShapeName,
} from './IsoShape.shapes'

interface IsoShapeProps {
  name: IsoShapeName
  /** Turn around the vertical axis, in radians. The size stays fixed to the unturned shape. */
  yaw?: number
  /** 0 at rest, 1 fully active. Moves the shape into its pose and fills it with glyphs. */
  activation?: number
  /** Advances the fill's glyphs. Each step drifts them up a row. */
  fluidStep?: number
  preserveAspectRatio?: string
  className?: string
}

interface FluidGlyph {
  key: string
  x: number
  y: number
  glyph: string
  isBeam: boolean
}

interface FluidGlyphsParams {
  area: IsoPoint[]
  level: number
  step: number
  flow: NonNullable<IsoBox['fillFlow']>
}

const PIECE_DELAY_MS = 105
// eighth turns, enough to catch a turning shape's widest reach
const FITTED_TURNS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
const GUIDES_LEAD_MS = 340

// kb draws 12px glyphs on an 8 by 10px grid. the shapes render near a quarter of their viewBox
const FLUID_COLUMN = 32
const FLUID_ROW = 40

// in viewBox units: rows rise from the edge and thin out toward the surface
const getFluidGlyphs = ({ area, level, step, flow }: FluidGlyphsParams): FluidGlyph[] => {
  const xs = area.map(([x]) => x)
  const ys = area.map(([, y]) => y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const edge = flow === 'down' ? Math.min(...ys) : Math.max(...ys)
  const rowStep = flow === 'down' ? FLUID_ROW : -FLUID_ROW
  const reach = (Math.max(...ys) - Math.min(...ys)) * level
  const rows = Math.ceil(reach / FLUID_ROW)
  const cols = Math.ceil((right - left) / FLUID_COLUMN)

  return Array.from({ length: rows }, (_, row) => row).flatMap((row) => {
    const cell = row - step
    const depth = 1 - (row * FLUID_ROW) / Math.max(1, reach)
    return Array.from({ length: cols }, (_, col) => col).flatMap((col) => {
      const glyph = rampGlyph(hash(col, cell) * (0.35 + 0.65 * depth))
      if (glyph === ' ') return []
      return [
        {
          key: `${row}:${col}`,
          x: left + col * FLUID_COLUMN,
          y: edge + row * rowStep,
          glyph,
          // a step is 200 ms, as on kb covers
          isBeam: isBeamAt({ col, row: cell, now: step * 200 }),
        },
      ]
    })
  })
}

// faces paint back to front and fill with the page color, so a near face hides the lines behind it
export const IsoShape = ({
  name,
  yaw = 0,
  activation,
  fluidStep = 0,
  preserveAspectRatio,
  className,
}: IsoShapeProps) => {
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const pose = ISO_SHAPE_POSES[name]
  const resting: IsoBox[] = ISO_SHAPES[name]
  const level = activation ?? 0
  const posed = pose && level ? pose(level) : resting
  const stillBoxes = ISO_SHAPE_STILL_BOXES[name] ?? []
  // glyphs stay on the listed boxes, or else inside a recess, which a turn can hide
  const fillBoxes = ISO_SHAPE_FILL_BOXES[name]
  // a turn orbits the still boxes, so they hold their place and paint in the right order
  const pivotBoxes = stillBoxes.length ? resting.filter((_, i) => stillBoxes.includes(i)) : resting
  const swing = ISO_SHAPE_SWINGS[name]
  const shapeYaw = swing === undefined ? yaw : Math.sin(yaw) * swing
  const turn: IsoTurn | undefined = shapeYaw
    ? { yaw: shapeYaw, pivot: planCenter(pivotBoxes) }
    : undefined
  const pieces = paintOrder(posed, turn).map((box) => {
    // the box's place in the shape, so its key holds while it moves
    const index = posed.indexOf(box)
    return {
      box,
      index,
      ...projectShape({ box, turn: stillBoxes.includes(index) ? undefined : turn }),
    }
  })
  const rings = (ISO_SHAPE_RINGS[name] ?? []).map((ring) => {
    const [x, y] = turn ? turnPoint([ring.x, ring.y], turn) : [ring.x, ring.y]
    const [cx, cy] = VIEW_POINTS.iso(x, y, ring.z)
    return { ...ring, cx, cy }
  })
  const solidRings = rings.filter((ring) => !ring.isDashed)
  // an animated shape fits its poses and its turn, so neither rescales it or leaves its box
  const isAnimated = activation !== undefined
  const fittedPoses = pose && isAnimated ? [resting, pose(0.5), pose(1)] : [resting]
  const fittedTurns: (IsoTurn | undefined)[] = isAnimated
    ? (swing === undefined ? FITTED_TURNS : [-swing, -swing / 2, 0, swing / 2, swing]).map(
        (fittedYaw) => ({
          yaw: fittedYaw,
          pivot: turn?.pivot ?? planCenter(pivotBoxes),
        })
      )
    : [undefined]
  const bounds = compositionBounds(
    [
      ...fittedPoses.flatMap((boxes) =>
        boxes.flatMap((box, index) =>
          fittedTurns.map((fittedTurn) =>
            projectShape({ box, turn: stillBoxes.includes(index) ? undefined : fittedTurn })
          )
        )
      ),
      ...ringBounds({ rings: ISO_SHAPE_RINGS[name] ?? [] }),
    ],
    ISO_SHAPE_PADDING[name] ?? 0
  )
  // the long side is 320 viewBox units. that is near its rendered size, so a 1 unit stroke stays near 1px
  const scale = 320 / Math.max(bounds.width, bounds.height)
  const toView = ([x, y]: IsoPoint): IsoPoint => [(x - bounds.x) * scale, (y - bounds.y) * scale]
  const toPoints = (polygon: IsoPoint[]) =>
    polygon.map((point) => toView(point).join(',')).join(' ')

  return (
    <svg
      aria-hidden
      // a zero size stops an unstyled shape from flashing before the css loads
      width={0}
      height={0}
      viewBox={`0 0 ${bounds.width * scale} ${bounds.height * scale}`}
      preserveAspectRatio={preserveAspectRatio}
      className={cn(
        'overflow-visible fill-background stroke-current text-border-stronger',
        className
      )}
    >
      {rings
        .filter((ring) => ring.isDashed)
        .map(({ x: ringX, y: ringY, cx, cy, radius }) => {
          const [x, y] = toView([cx, cy])
          return (
            <circle
              key={`${ringX}:${ringY}`}
              cx={x}
              cy={y}
              r={radius * scale}
              fill="none"
              strokeDasharray="3.6 3.6"
              style={{
                animationDelay: `${GUIDES_LEAD_MS + (solidRings.length + pieces.length) * PIECE_DELAY_MS}ms`,
              }}
              className="motion-safe:animate-fade-in"
            />
          )
        })}
      {solidRings.map(({ x: ringX, y: ringY, cx, cy, radius }, index) => {
        const [x, y] = toView([cx, cy])
        return (
          <circle
            key={`${ringX}:${ringY}`}
            cx={x}
            cy={y}
            r={radius * scale}
            pathLength={1}
            style={{ animationDelay: `${GUIDES_LEAD_MS + index * PIECE_DELAY_MS}ms` }}
            className="[stroke-dasharray:1] motion-safe:animate-draw-line-fast"
          />
        )
      })}
      {pieces.map((piece, order) => (
        <g key={piece.index}>
          {[...piece.faces, ...piece.insets].map((polygon, polygonIndex) => (
            <polygon
              // positional, so a turn or pose updates points in place instead of remounting
              key={polygonIndex}
              points={toPoints(polygon)}
              pathLength={1}
              strokeLinejoin="round"
              style={{
                animationDelay: `${GUIDES_LEAD_MS + (solidRings.length + order) * PIECE_DELAY_MS}ms`,
              }}
              className="[stroke-dasharray:1] motion-safe:animate-draw-line-fast"
            />
          ))}
          {level > 0 && (fillBoxes ? fillBoxes.includes(piece.index) : piece.insets.length > 0) ? (
            <>
              <clipPath id={`${clipId}-${piece.index}`}>
                <polygon points={toPoints(piece.fill)} />
              </clipPath>
              <g
                clipPath={`url(#${clipId}-${piece.index})`}
                stroke="none"
                fontSize={48}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono"
              >
                {getFluidGlyphs({
                  area: piece.fill.map(toView),
                  level,
                  step: fluidStep,
                  flow: piece.box.fillFlow ?? 'up',
                }).map(({ key, x, y, glyph, isBeam }) => (
                  <text
                    key={key}
                    x={x}
                    y={y}
                    opacity={isBeam ? BEAM_ALPHA : 1}
                    className={isBeam ? 'fill-brand' : 'fill-foreground-muted'}
                  >
                    {glyph}
                  </text>
                ))}
              </g>
            </>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
