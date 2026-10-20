import { cn } from 'ui'

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

export interface TopicShapeProps {
  topic: Topic
  className?: string
}

const PIECE_DELAY_MS = 105
const GUIDES_LEAD_MS = 340

// faces paint back to front and fill with the page color, so a near face hides the lines behind it
export const TopicShape = ({ topic, className }: TopicShapeProps) => {
  const boxes = paintOrder(HERO_SHAPES[topic])
  const pieces = boxes.map((box) => projectShape({ box }))
  const rings = (HERO_RINGS[topic] ?? []).map((ring) => {
    const [cx, cy] = VIEW_POINTS.iso(ring.x, ring.y, ring.z)
    return { ...ring, cx, cy }
  })
  const solidRings = rings.filter((ring) => !ring.isDashed)
  const bounds = compositionBounds([...pieces, ...ringBounds({ rings })], HERO_PADDING[topic] ?? 0)
  // the long side is 320 viewBox units. that is near its rendered size, so a 1 unit stroke stays near 1px
  const scale = 320 / Math.max(bounds.width, bounds.height)
  const toView = ([x, y]: IsoPoint): IsoPoint => [(x - bounds.x) * scale, (y - bounds.y) * scale]
  const toPoints = (polygon: IsoPoint[]) =>
    polygon.map((point) => toView(point).join(',')).join(' ')

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
              className="motion-safe:animate-fade-in"
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
            className="[stroke-dasharray:1] motion-safe:animate-draw-line-fast"
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
            className="[stroke-dasharray:1] motion-safe:animate-draw-line-fast"
          />
        ))
      )}
    </svg>
  )
}
