import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import { coverField, pickCoverTopic } from '../lib/ascii/cover-shapes'
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  clamp,
  fitEdges,
  GLYPH_PITCH,
  splitEdges,
  uniformEdges,
  type Lattice,
} from '../lib/ascii/field'
import type { FeaturedGuide } from '../lib/guides'
import { useQueryVariant } from '../lib/use-query-variant'
import { AsciiCanvas, type CanvasSize, type FieldParams } from './AsciiCanvas'
import { FeaturedBookshelf } from './FeaturedBookshelf'

export interface FeaturedGuidesProps {
  guides: FeaturedGuide[]
  className?: string
}

interface CoverSlideProps {
  guide: FeaturedGuide
  position: number
  total: number
  isActive: boolean
}

interface CenteredScrollLeftParams {
  track: HTMLElement
  slide: HTMLElement
}

const CENTER_LINE_MARGIN = '0px -50% 0px -50%'
const COVER_WAKE_RADIUS = 100

const FEATURED_VARIANTS = ['carousel', 'book'] as const

const getCoverGrid = ({ width, height }: CanvasSize): Lattice => ({
  xs: fitEdges({ size: width, target: CELL_WIDTH }),
  ys: uniformEdges({ size: height, step: CELL_HEIGHT }),
})

const getCoverLattice = (size: CanvasSize): Lattice => {
  const grid = getCoverGrid(size)
  return { xs: splitEdges({ edges: grid.xs, target: GLYPH_PITCH }), ys: grid.ys }
}

const centeredScrollLeft = ({ track, slide }: CenteredScrollLeftParams) =>
  slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2

export const FeaturedGuides = (props: FeaturedGuidesProps) => {
  const variant = useQueryVariant({
    key: 'featured',
    options: FEATURED_VARIANTS,
    fallback: 'carousel',
  })
  return variant === 'book' ? <FeaturedBookshelf {...props} /> : <FeaturedCarousel {...props} />
}

const FeaturedCarousel = ({ guides, className }: FeaturedGuidesProps) => {
  const middleIndex = Math.floor(guides.length / 2)
  const [activeIndex, setActiveIndex] = useState(middleIndex)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const targetIndexRef = useRef(middleIndex)

  const bindTrack = useCallback((track: HTMLDivElement | null) => {
    trackRef.current = track
    if (!track) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Array.prototype.indexOf.call(track.children, entry.target)
          targetIndexRef.current = index
          setActiveIndex(index)
        }
      },
      { root: track, rootMargin: CENTER_LINE_MARGIN, threshold: 0 }
    )
    const middle = track.children[Math.floor(track.children.length / 2)]
    if (middle instanceof HTMLElement)
      track.scrollLeft = centeredScrollLeft({ track, slide: middle })
    for (const slide of track.children) observer.observe(slide)
    return () => observer.disconnect()
  }, [])

  const scrollToSlide = (index: number) => {
    const track = trackRef.current
    const target = clamp(index, 0, guides.length - 1)
    const slide = track?.children[target]
    if (!track || !(slide instanceof HTMLElement)) return
    targetIndexRef.current = target
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({
      left: centeredScrollLeft({ track, slide }),
      behavior: isReducedMotion ? 'auto' : 'smooth',
    })
  }

  const handlePreviousClick = () => scrollToSlide(targetIndexRef.current - 1)
  const handleNextClick = () => scrollToSlide(targetIndexRef.current + 1)

  if (guides.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby="featured-guides"
      className={cn('flex flex-col gap-8', className)}
    >
      <header className="mx-auto flex w-full max-w-6xl items-end justify-between px-6">
        <h2
          id="featured-guides"
          className="m-0 font-sans! text-xl font-medium! tracking-[-0.015em] text-foreground"
        >
          Featured guides
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="tiny"
            aria-label="Previous guide"
            disabled={activeIndex === 0}
            onClick={handlePreviousClick}
            icon={<ArrowLeft aria-hidden strokeWidth={2.25} />}
          />
          <Button
            variant="default"
            size="tiny"
            aria-label="Next guide"
            disabled={activeIndex === guides.length - 1}
            onClick={handleNextClick}
            icon={<ArrowRight aria-hidden strokeWidth={2.25} />}
          />
        </div>
      </header>
      <div
        ref={bindTrack}
        className={cn(
          'relative -my-2 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain py-2',
          'px-[max(1.5rem,calc((100%-69rem)/2))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {guides.map((guide, index) => (
          <CoverSlide
            key={guide.slot}
            guide={guide}
            position={index + 1}
            total={guides.length}
            isActive={index === activeIndex}
          />
        ))}
      </div>
    </section>
  )
}

const CoverSlide = ({ guide, position, total, isActive }: CoverSlideProps) => {
  const titleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const getField = (params: FieldParams) =>
    coverField({ ...params, topic: pickCoverTopic(guide.topics) })

  return (
    <article
      aria-roledescription="slide"
      aria-label={`${position} of ${total}: ${guide.title}`}
      inert={!isActive}
      className={cn(
        'relative h-120 w-[min(69rem,calc(100vw-3rem))] shrink-0 snap-center overflow-hidden',
        'rounded-lg bg-surface-75 shadow-codeblock',
        "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:border after:border-default after:content-['']"
      )}
    >
      <AsciiCanvas
        getLattice={getCoverLattice}
        getGridLattice={getCoverGrid}
        getField={getField}
        keepOutRefs={[titleRef, descriptionRef, ctaRef]}
        wakeRadius={COVER_WAKE_RADIUS}
        isActive={isActive}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col sm:flex-row sm:items-end">
        <div ref={titleRef} className="min-w-0 bg-surface-75 px-6 pb-3 pt-6 sm:flex-1 sm:pb-6">
          <h3 className="m-0 font-sans! text-3xl font-medium! leading-8 tracking-[-0.025em] text-foreground sm:max-w-95 sm:text-[40px] sm:leading-11">
            {guide.title}
          </h3>
        </div>
        <p
          ref={descriptionRef}
          className={cn(
            'm-0 bg-surface-75 px-6 pb-4 text-sm leading-5.5 text-foreground-light',
            'sm:w-100 sm:shrink-0 sm:p-6'
          )}
        >
          {guide.description}
        </p>
        <div
          ref={ctaRef}
          className="bg-surface-75 px-6 pb-6 sm:flex sm:w-50 sm:shrink-0 sm:justify-end sm:pt-6"
        >
          <Button asChild variant="secondary" size="small">
            <a href={guide.href}>{guide.actionLabel ?? 'Read guide'}</a>
          </Button>
        </div>
      </div>
    </article>
  )
}
