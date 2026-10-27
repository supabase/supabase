import { useRef } from 'react'
import { cn } from 'ui'
import { GlyphLines } from 'ui-patterns/GlyphLines'

import { CELL_HEIGHT, CELL_WIDTH } from '../lib/ascii/field'

export interface HeroGridProps {
  // rows and columns are separate layers, so the hero can mask each one differently
  axis: 'rows' | 'columns'
  text: string
  isMirrored?: boolean
  className?: string
}

// the same height as a topic shape, so a cell lines up with the shape at any size
const GRID_HEIGHT = 320
// a line runs this far from its middle, in viewBox units. it must pass every border it can meet
const GRID_REACH = 2400

export const HeroGrid = ({ axis, text, isMirrored, className }: HeroGridProps) => {
  const linesRef = useRef<SVGSVGElement>(null)
  const lines =
    axis === 'columns'
      ? // the grid hero's cells. 12 columns go past the page middle. there is no middle column, because it would cut the shape
        [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].map((step) => ({
          x: step * CELL_WIDTH,
          y: GRID_HEIGHT / 2,
          dx: 0,
          dy: 1,
        }))
      : // 6 rows of 4 cells, from one row above the copy
        [-1, 0, 1, 2, 3, 4].map((step) => ({
          x: 0,
          y: GRID_HEIGHT / 2 + step * CELL_HEIGHT * 4,
          dx: 1,
          dy: 0,
        }))

  return (
    <div aria-hidden className={cn(isMirrored && '-scale-x-100', className)}>
      <GlyphLines
        linesRef={linesRef}
        text={text}
        className={cn(
          'absolute inset-0 size-full font-mono caret-background text-border-stronger',
          '[--glyph-lines-pulse:var(--color-border-control-hover)]',
          isMirrored && '-scale-x-100'
        )}
      />
      <svg
        ref={linesRef}
        // the classes size it. until the css loads, a zero size keeps it from flashing
        width={0}
        height={0}
        viewBox={`-0.5 0 1 ${GRID_HEIGHT}`}
        className="group/grid block size-full overflow-visible fill-none"
      >
        {lines.flatMap(({ x, y, dx, dy }, index) =>
          [1, -1].map((side) => (
            <line
              key={`${x}:${y}:${side}`}
              x1={x}
              y1={y}
              x2={x + dx * side * GRID_REACH}
              y2={y + dy * side * GRID_REACH}
              pathLength={1}
              data-glyph-line
              style={{ animationDelay: `${index * 22}ms` }}
              className="[stroke-dasharray:1] motion-safe:group-data-glyph-lines-ready/grid:animate-draw-line"
            />
          ))
        )}
      </svg>
    </div>
  )
}
