import { ArrowRight } from 'lucide-react'
import { useId, type CSSProperties } from 'react'
import { cn } from 'ui'
import { getNotchMask, getNotchOutline } from 'ui-patterns/Notch'

import type { FeaturedItem } from '../lib/guides'
import { bindRevealOnce, REVEAL_GROUP_CLASS, REVEAL_ITEM_CLASS, revealStyle } from '../lib/reveal'
import { AsciiHoverText } from './AsciiHoverText'
import { TopicCover } from './TopicCover'

export interface FeaturedSectionProps {
  title: string
  items: FeaturedItem[]
  className?: string
}

interface FeaturedCoverProps {
  item: FeaturedItem
  hasDates: boolean
}

type NotchStyle = CSSProperties & { '--notch-width': string; '--notch-mask': string }

const NOTCH_WIDTH = 40

const NOTCH_STYLE: NotchStyle = {
  '--notch-width': `${NOTCH_WIDTH}px`,
  '--notch-mask': getNotchMask(NOTCH_WIDTH),
}

export const FeaturedSection = ({ title, items, className }: FeaturedSectionProps) => {
  const headingId = useId()
  const hasDates = items.some((item) => item.date)
  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-8', className)}>
      <header
        ref={bindRevealOnce}
        className={cn('mx-auto flex w-full max-w-6xl px-6', REVEAL_GROUP_CLASS)}
      >
        <h2
          id={headingId}
          style={revealStyle(0)}
          className={cn(
            'm-0 font-sans! text-xl font-medium! tracking-title text-foreground',
            REVEAL_ITEM_CLASS
          )}
        >
          <AsciiHoverText text={title} glyphClassName="after:text-foreground" />
        </h2>
      </header>
      <ul
        ref={bindRevealOnce}
        className={cn(
          'mx-auto grid w-full max-w-6xl list-none gap-6 px-6 sm:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]',
          REVEAL_GROUP_CLASS
        )}
      >
        {items.map((item, index) => (
          <li key={item.slot} style={revealStyle(index + 1)} className={REVEAL_ITEM_CLASS}>
            <FeaturedCover item={item} hasDates={hasDates} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const FeaturedCover = ({ item, hasDates }: FeaturedCoverProps) => (
  <a
    href={item.href}
    style={NOTCH_STYLE}
    className="group/cover relative block rounded-lg focus-ring"
  >
    <div className="drop-shadow-raised">
      <TopicCover
        title={item.title}
        description={item.description}
        topics={item.topics}
        date={hasDates ? (item.date ?? '') : undefined}
        className={cn('cover-notch', hasDates ? 'h-115.5' : 'h-107.5')}
      />
    </div>
    <svg
      aria-hidden
      width={NOTCH_WIDTH + 8}
      height="40"
      viewBox={`0 0 ${NOTCH_WIDTH + 8} 40`}
      fill="none"
      className="pointer-events-none absolute right-0 bottom-0 z-20 overflow-visible"
    >
      <path d={getNotchOutline(NOTCH_WIDTH)} className="stroke-(--background-surface-75)" />
      <path d={getNotchOutline(NOTCH_WIDTH)} className="stroke-border" />
    </svg>
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 bottom-0 z-20 flex h-8 w-(--notch-width) items-center justify-center overflow-hidden"
    >
      <ArrowRight
        strokeWidth={2.25}
        className={cn(
          'size-3.5 -translate-x-7 text-foreground-light',
          'transition-transform duration-200 ease-out-strong motion-reduce:transition-none',
          'group-hover/cover:translate-x-px group-focus-visible/cover:translate-x-px'
        )}
      />
    </span>
  </a>
)
