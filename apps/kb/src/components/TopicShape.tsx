import { cn } from 'ui'

import { CELL_HEIGHT, CELL_WIDTH } from '../lib/ascii/field'
import { HERO_RINGS, HERO_SHAPES } from '../lib/hero-shapes'
import {
  compositionBounds,
  paintOrder,
  projectShape,
  VIEW_POINTS,
  type IsoPoint,
} from '../lib/iso-shapes'
import type { Topic } from '../lib/topics'

export interface TopicShapeProps {
  topic: Topic
  layer: 'guides' | 'shape'
  className?: string
}

type Line = [IsoPoint, IsoPoint]

const PIECE_DELAY_MS = 105
const GUIDES_LEAD_MS = 340
// a guide runs this far from its middle, in viewBox units. it must pass every border it can meet
const GUIDE_REACH = 2400

const isSameLine = ([[ax1, ay1], [ax2, ay2]]: Line, [[bx1, by1], [bx2, by2]]: Line) => {
  const angleA = Math.atan2(ay2 - ay1, ax2 - ax1)
  const angleB = Math.atan2(by2 - by1, bx2 - bx1)
  const turn = Math.abs((angleA - angleB) % Math.PI)
  if (Math.min(turn, Math.PI - turn) > 0.01) return false
  const offsetA = ax1 * Math.sin(angleA) - ay1 * Math.cos(angleA)
  const offsetB = bx1 * Math.sin(angleA) - by1 * Math.cos(angleA)
  return Math.abs(offsetA - offsetB) < 2
}

// faces paint back to front and fill with the page color, so a near face hides the lines behind it
export const TopicShape = ({ topic, layer, className }: TopicShapeProps) => {
  const boxes = paintOrder(HERO_SHAPES[topic])
  const pieces = boxes.map((box) => projectShape({ box }))
  const rings = (HERO_RINGS[topic] ?? []).map((ring) => {
    const [cx, cy] = VIEW_POINTS.iso(ring.x, ring.y, ring.z)
    return { ...ring, cx, cy }
  })
  const solidRings = rings.filter((ring) => !ring.isDashed)
  const ringBounds = rings.map(({ cx, cy, radius }) => ({
    faces: [
      [
        [cx - radius, cy - radius],
        [cx + radius, cy + radius],
      ] satisfies IsoPoint[],
    ],
  }))
  const bounds = compositionBounds([...pieces, ...ringBounds], 0)
  // the long side is 320 viewBox units. that is near its rendered size, so a 1 unit stroke stays near 1px
  const scale = 320 / Math.max(bounds.width, bounds.height)
  const toView = ([x, y]: IsoPoint): IsoPoint => [(x - bounds.x) * scale, (y - bounds.y) * scale]
  const toPoints = (polygon: IsoPoint[]) =>
    polygon.map((point) => toView(point).join(',')).join(' ')
  // the grid hero's cells: 13 columns reach past half the page. the 6 rows of 4 cells start at the copy
  const columns = Array.from({ length: 13 }, (_, k): Line => {
    const x = (bounds.width * scale) / 2 + (k - 6) * CELL_WIDTH
    return [
      [x, 0],
      [x, 1],
    ]
  })
  const rows = Array.from({ length: 6 }, (_, k): Line => {
    const y = (bounds.height * scale) / 2 + (k - 1) * CELL_HEIGHT * 4
    return [
      [0, y],
      [1, y],
    ]
  })
  const allGuideLines: Line[] = [
    ...[
      ...boxes.flatMap((box): Line[] => {
        // posts are the left, front and right vertical edges. a box keeps its front edge, a cylinder its sides
        const { posts } = projectShape({ box })
        const edges = box.shape === 'cylinder' ? [posts[0], posts[2]] : [posts[1]]
        return edges.map(([px, py]) => [
          VIEW_POINTS.iso(px, py, box.z),
          VIEW_POINTS.iso(px, py, box.z + box.h),
        ])
      }),
    ].map(([from, to]): Line => [toView(from), toView(to)]),
    ...columns,
    ...rows,
  ]
  // the guides are infinite, so two lines on one axis draw once
  const guideLines = allGuideLines.reduce<Line[]>(
    (kept, line) => (kept.some((other) => isSameLine(other, line)) ? kept : [...kept, line]),
    []
  )
  const guides = guideLines.flatMap(([[x1, y1], [x2, y2]], index) => {
    const length = Math.hypot(x2 - x1, y2 - y1)
    const [ux, uy] = [((x2 - x1) / length) * GUIDE_REACH, ((y2 - y1) / length) * GUIDE_REACH]
    const middle: IsoPoint = [(x1 + x2) / 2, (y1 + y2) / 2]
    return [1, -1].map((side) => ({
      index,
      from: middle,
      to: [middle[0] + ux * side, middle[1] + uy * side] satisfies IsoPoint,
    }))
  })

  return (
    <svg
      aria-hidden
      // the classes size it. until the css lands, a zero size keeps an unstyled shape from flashing
      width={0}
      height={0}
      viewBox={`0 0 ${bounds.width * scale} ${bounds.height * scale}`}
      className={cn(
        'overflow-visible fill-background stroke-current text-border-stronger',
        className
      )}
    >
      {layer === 'guides' ? (
        <g className="fill-none text-border">
          {guides.map(({ index, from: [x1, y1], to: [x2, y2] }) => (
            <line
              key={`${x2}:${y2}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              pathLength={1}
              style={{ animationDelay: `${index * 22}ms` }}
              className="[stroke-dasharray:1] motion-safe:animate-[draw-line_1.8s_linear_both]"
            />
          ))}
        </g>
      ) : null}
      {layer === 'shape' ? (
        <>
          {rings
            .filter((ring) => ring.isDashed)
            .map(({ cx, cy, radius }) => {
              const [x, y] = toView([cx, cy])
              return (
                <circle
                  key={`${cx}:${cy}`}
                  cx={x}
                  cy={y}
                  r={radius * scale}
                  fill="none"
                  strokeDasharray="3.6 3.6"
                  style={{
                    animationDelay: `${GUIDES_LEAD_MS + (solidRings.length + pieces.length) * PIECE_DELAY_MS}ms`,
                  }}
                  className="motion-safe:animate-[fade-in_450ms_ease-out_both]"
                />
              )
            })}
          {solidRings.map(({ cx, cy, radius }, index) => {
            const [x, y] = toView([cx, cy])
            return (
              <circle
                key={`${cx}:${cy}`}
                cx={x}
                cy={y}
                r={radius * scale}
                pathLength={1}
                style={{ animationDelay: `${GUIDES_LEAD_MS + index * PIECE_DELAY_MS}ms` }}
                className="[stroke-dasharray:1] motion-safe:animate-[draw-line_850ms_cubic-bezier(0.65,0,0.35,1)_both]"
              />
            )
          })}
          {pieces.flatMap((piece, index) =>
            [...piece.faces, ...piece.insets].map((polygon) => (
              <polygon
                key={toPoints(polygon)}
                points={toPoints(polygon)}
                pathLength={1}
                strokeLinejoin="round"
                style={{
                  animationDelay: `${GUIDES_LEAD_MS + (solidRings.length + index) * PIECE_DELAY_MS}ms`,
                }}
                className="[stroke-dasharray:1] motion-safe:animate-[draw-line_850ms_cubic-bezier(0.65,0,0.35,1)_both]"
              />
            ))
          )}
        </>
      ) : null}
    </svg>
  )
}
