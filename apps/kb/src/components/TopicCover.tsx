import { useRef } from 'react'
import { cn } from 'ui'

import { coverField, pickCoverTopic } from '../lib/ascii/cover-shapes'
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  fitEdges,
  GLYPH_PITCH,
  splitEdges,
  uniformEdges,
  type Lattice,
} from '../lib/ascii/field'
import type { Topic } from '../lib/topics'
import { AsciiCanvas, type CanvasSize, type FieldParams } from './AsciiCanvas'

export interface TopicCoverProps {
  title: string
  description: string
  topics: Topic[]
  className?: string
}

const getCoverGrid = ({ width, height }: CanvasSize): Lattice => ({
  xs: fitEdges({ size: width, target: CELL_WIDTH }),
  ys: uniformEdges({ size: height, step: CELL_HEIGHT }),
})

const getCoverLattice = (size: CanvasSize): Lattice => {
  const grid = getCoverGrid(size)
  return { xs: splitEdges({ edges: grid.xs, target: GLYPH_PITCH }), ys: grid.ys }
}

export const TopicCover = ({ title, description, topics, className }: TopicCoverProps) => {
  const textRef = useRef<HTMLDivElement>(null)
  const getField = (params: FieldParams) => coverField({ ...params, topic: pickCoverTopic(topics) })

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-75 shadow-raised',
        "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-lg after:border after:border-default after:content-['']",
        className
      )}
    >
      <AsciiCanvas
        getLattice={getCoverLattice}
        getGridLattice={getCoverGrid}
        getField={getField}
        keepOutRefs={[textRef]}
        isInteractive={false}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div ref={textRef} className="flex flex-col gap-3 bg-surface-75 px-6 pb-6">
          <h3 className="m-0 grid min-h-[2lh] content-end font-sans! text-3xl font-medium! leading-8 tracking-tight text-foreground">
            <span className="line-clamp-2">{title}</span>
          </h3>
          <p className="m-0 line-clamp-2 min-h-[2lh] max-w-100 pr-8 text-sm leading-5.5 text-foreground-light">
            {description}
          </p>
        </div>
      </div>
    </article>
  )
}
