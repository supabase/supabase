import { cn } from 'ui'

import { pickCoverTopic } from '../lib/ascii/cover-shapes'
import type { FeaturedGuide } from '../lib/guides'
import {
  compositionBounds,
  FALLBACK_COMPOSITION,
  ISO_COMPOSITIONS,
  paintOrder,
  projectBox,
  type IsoBox,
  type IsoPoint,
} from '../lib/iso-shapes'
import { bindRevealOnce, REVEAL_GROUP_CLASS, REVEAL_ITEM_CLASS, revealStyle } from '../lib/reveal'

export interface FeaturedBookshelfProps {
  guides: FeaturedGuide[]
  className?: string
}

interface BookCardProps {
  guide: FeaturedGuide
}

interface IsoDrawingProps {
  boxes: IsoBox[]
  className?: string
}

const COVER_TEXTURE_STYLE = {
  backgroundImage: `url(${import.meta.env.BASE_URL}/textures/book-cover.jpg)`,
}

const GRAIN_FILTER_ID = 'kb-book-grain'
const GRAIN_THRESHOLD = 0.42
const GRAIN_CONTRAST = 9
const RED_TO_ALPHA = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0'

const toPoints = (points: IsoPoint[]) => points.map(([px, py]) => `${px},${py}`).join(' ')

const segment = ([x1, y1]: IsoPoint, [x2, y2]: IsoPoint) => ({ x1, y1, x2, y2 })

export const FeaturedBookshelf = ({ guides, className }: FeaturedBookshelfProps) => (
  <section aria-labelledby="featured-guides" className={cn('flex flex-col gap-8', className)}>
    <header className="mx-auto flex w-full max-w-6xl px-6">
      <h2
        id="featured-guides"
        className="m-0 font-sans! text-xl font-medium! tracking-[-0.015em] text-foreground"
      >
        Featured guides
      </h2>
    </header>
    <ul
      ref={bindRevealOnce}
      className={cn(
        'mx-auto grid w-full max-w-6xl list-none gap-x-16 gap-y-12 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-28',
        REVEAL_GROUP_CLASS
      )}
    >
      {guides.map((guide, index) => (
        <li key={guide.slot} style={revealStyle(index)} className={REVEAL_ITEM_CLASS}>
          <BookCard guide={guide} />
        </li>
      ))}
    </ul>
    <GrainFilter />
  </section>
)

const BookCard = ({ guide }: BookCardProps) => {
  const topic = pickCoverTopic(guide.topics)
  const { titleAt, boxes } = topic ? ISO_COMPOSITIONS[topic] : FALLBACK_COMPOSITION
  const isTitleAtBottom = titleAt === 'bottom'

  return (
    <a
      href={guide.href}
      className="group flex flex-col gap-6 rounded-[10px] text-inherit no-underline focus-ring"
    >
      <article
        style={COVER_TEXTURE_STYLE}
        className={cn(
          'relative flex h-92 overflow-hidden bg-alternative',
          'bg-cover bg-center bg-blend-color-dodge',
          'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),0_20px_36px_rgb(0_0_0/0.5),0_2px_4px_rgb(0_0_0/0.25)]',
          'transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-1',
          isTitleAtBottom ? 'flex-col-reverse' : 'flex-col'
        )}
      >
        <div
          aria-hidden
          className={cn('flex shrink-0 flex-col gap-2 px-6', isTitleAtBottom ? 'pb-6' : 'pt-7')}
        >
          {topic && topic !== guide.title ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-foreground-lighter">
              {topic}
            </span>
          ) : null}
          <span className="font-serif text-[29px] leading-8 tracking-[-0.015em] text-balance text-foreground">
            {guide.title}
          </span>
        </div>
        <IsoDrawing boxes={boxes} className="min-h-0 w-full flex-1" />
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-2.5 bg-linear-to-r from-white/10 via-white/3 via-60% to-black/25"
        />
      </article>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-sans! text-lg font-medium! leading-6.5 tracking-[-0.012em] text-foreground">
          {guide.title}
        </h3>
        <p className="m-0 text-sm leading-5.5 text-foreground-light">{guide.description}</p>
      </div>
    </a>
  )
}

const IsoDrawing = ({ boxes, className }: IsoDrawingProps) => {
  const projected = paintOrder(boxes).map(projectBox)
  const { x, y, width, height } = compositionBounds(projected)

  return (
    <svg
      aria-hidden
      viewBox={`${x} ${y} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        '[filter:url(#kb-book-grain)] [&_*]:[vector-effect:non-scaling-stroke]',
        className
      )}
    >
      <g className="stroke-foreground-muted/40" strokeWidth={0.6}>
        {projected.flatMap((box) =>
          box.guides.map(([from, to]) => (
            <line key={`${box.key}-${from.join()}`} {...segment(from, to)} />
          ))
        )}
      </g>
      {projected.map((box) => (
        <g key={box.key}>
          {box.faces.map((face) => (
            <polygon
              key={face.join()}
              points={toPoints(face)}
              className="fill-background-alternative"
            />
          ))}
          <g className="stroke-foreground-muted/50" strokeWidth={0.7}>
            {box.hiddenEdges.map(([from, to]) => (
              <line key={to.join()} {...segment(from, to)} />
            ))}
          </g>
          <g className="stroke-foreground-light" strokeWidth={1.6}>
            {box.faces.map((face) => (
              <polygon key={face.join()} points={toPoints(face)} />
            ))}
            {box.insets.map((inset) => (
              <polygon key={inset.join()} points={toPoints(inset)} strokeWidth={1.1} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}

const GrainFilter = () => (
  <svg aria-hidden className="absolute size-0">
    <filter
      id={GRAIN_FILTER_ID}
      x="0"
      y="0"
      width="100%"
      height="100%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.75"
        numOctaves={2}
        seed={20261001}
        stitchTiles="stitch"
        result="noise"
      />
      <feColorMatrix in="noise" type="matrix" values={RED_TO_ALPHA} result="field" />
      <feComponentTransfer in="field" result="wear">
        <feFuncA
          type="linear"
          slope={-GRAIN_CONTRAST}
          intercept={GRAIN_THRESHOLD * GRAIN_CONTRAST}
        />
      </feComponentTransfer>
      <feComposite operator="out" in="SourceGraphic" in2="wear" />
    </filter>
  </svg>
)
