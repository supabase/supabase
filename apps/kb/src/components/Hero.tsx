import { Search } from 'lucide-react'
import { useRef, useSyncExternalStore, type ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import type { Topic } from '../lib/topics'
import { AsciiHoverText } from './AsciiHoverText'
import { FrameGlyphs } from './FrameGlyphs'
import { HeroGrid } from './HeroGrid'
import { InfallText } from './InfallText'
import { openKbSearch } from './KbSearch'
import { TopicShape } from './TopicShape'
import { WarpCanvas } from './WarpCanvas'

export interface HeroProps {
  title: string
  description: string
  breadcrumb?: ReactNode
  variant?: 'warp' | 'construction'
  topic?: Topic
  children?: ReactNode
  className?: string
}

export interface TopicHeroProps {
  topic: Topic
  description: string
  breadcrumb?: ReactNode
  className?: string
}

interface CopyFrameProps {
  lines: { id: string; className: string; fade?: number }[]
}

interface HeroFlanksProps {
  topic: Topic
  text: string
}

export interface HomeHeroProps {
  className?: string
}

const DRAW_OUT = 'motion-safe:group-data-frame-glyphs-ready/hero:animate-draw-out'

const FLANK_BOX = cn(
  'flank-mask absolute -top-[100vh] h-[calc(100%+200vh)] w-[50vw]',
  'pointer-events-none py-[100vh] pl-12 pr-92 max-lg:hidden'
)

const ACROSS = 'left-1/2 h-px w-screen -translate-x-1/2'
const UPRIGHT = 'inset-y-0 w-px origin-top'

const subscribeToNothing = () => () => {}

const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent)

const getIsMacOnServer = () => false

export const Hero = ({
  title,
  description,
  breadcrumb,
  variant = 'warp',
  topic,
  children,
  className,
}: HeroProps) => {
  const isWarp = variant === 'warp'
  const text = `${title} + ${description} + `.toUpperCase()
  const copyRef = useRef<HTMLDivElement>(null)

  return (
    <section
      className={cn(
        'group/hero relative isolate flex justify-center',
        isWarp ? 'pt-39 pb-60' : 'max-lg:py-10 max-lg:border-b lg:pt-32.5 lg:pb-40',
        'overflow-hidden bg-background',
        className
      )}
    >
      {isWarp ? <WarpCanvas anchorRef={copyRef} text={text} /> : null}
      {variant === 'construction' ? (
        <FrameGlyphs text={text} className="z-20 caret-background text-border-stronger" />
      ) : null}
      {variant === 'construction' ? (
        <CopyFrame
          lines={[
            {
              id: 'left',
              className: cn('right-[calc(50%+20rem)] max-lg:hidden', UPRIGHT, DRAW_OUT),
              fade: 0.7,
            },
            {
              id: 'right',
              className: cn('left-[calc(50%+20rem)] max-lg:hidden', UPRIGHT, DRAW_OUT),
              fade: 0.7,
            },
          ]}
        />
      ) : null}
      <div className="relative z-10 w-full max-w-6xl px-6">
        {isWarp ? (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-1/2 top-1/2 -z-10 h-100 w-205 max-w-screen',
              '-translate-x-1/2 -translate-y-1/2',
              'bg-radial-[closest-side] from-background/95 via-background/80 via-65% to-transparent'
            )}
          />
        ) : null}
        <div
          ref={copyRef}
          className={cn(
            'relative flex flex-col items-center gap-5 text-center',
            isWarp ? 'py-16' : 'pt-12 pb-9.5'
          )}
        >
          {variant === 'construction' && topic ? (
            <TopicShape topic={topic} text={text} className="h-45 w-full lg:hidden" />
          ) : null}
          {breadcrumb}
          <h1 className="m-0 text-5xl tracking-display text-foreground sm:text-6xl">
            {isWarp ? (
              <InfallText text={title} hoverGlyphClassName="after:text-foreground" />
            ) : (
              <AsciiHoverText text={title} glyphClassName="after:text-foreground" />
            )}
          </h1>
          <p className="m-0 min-h-[2lh] max-w-145 text-balance text-lg leading-7 text-foreground-light">
            {isWarp ? <InfallText text={description} /> : description}
          </p>
          {children}
          {variant === 'construction' && topic ? <HeroFlanks topic={topic} text={text} /> : null}
        </div>
      </div>
    </section>
  )
}

export const HomeHero = ({ className }: HomeHeroProps) => {
  return (
    <Hero
      title="Knowledge base"
      description="In-depth guides, tutorials, troubleshooting, and explainers for best practices for Supabase"
      className={className}
    >
      <HeroSearch />
    </Hero>
  )
}

export const TopicHero = ({ topic, description, breadcrumb, className }: TopicHeroProps) => (
  <Hero
    variant="construction"
    topic={topic}
    title={topic}
    description={description}
    breadcrumb={breadcrumb}
    className={className}
  />
)

const HeroFlanks = ({ topic, text }: HeroFlanksProps) => (
  <>
    <HeroGrid axis="rows" text={text} className={cn('right-1/2', FLANK_BOX)} />
    <HeroGrid axis="rows" text={text} isMirrored className={cn('left-1/2', FLANK_BOX)} />
    <HeroGrid
      axis="columns"
      text={text}
      className={cn('right-1/2 [--flank-span:calc(100%_-_20rem)]', FLANK_BOX)}
    />
    <HeroGrid
      axis="columns"
      text={text}
      isMirrored
      className={cn('left-1/2 [--flank-span:calc(100%_-_20rem)]', FLANK_BOX)}
    />
    <TopicShape topic={topic} text={text} className={cn('right-1/2', FLANK_BOX)} />
    <TopicShape topic={topic} text={text} isMirrored className={cn('left-1/2', FLANK_BOX)} />
    <CopyFrame
      lines={[
        { id: 'top', className: cn('top-0', ACROSS, DRAW_OUT) },
        {
          id: 'band',
          className: cn('-top-[calc(var(--spacing)*32.5/2)] max-lg:hidden', ACROSS, DRAW_OUT),
        },
        { id: 'bottom', className: cn('bottom-0', ACROSS, DRAW_OUT) },
        {
          id: 'stem',
          className: cn('bottom-full left-1/2 h-screen w-px origin-bottom', DRAW_OUT),
        },
        {
          id: 'tail',
          className: cn('top-full left-1/2 h-40 w-px origin-top', DRAW_OUT),
          fade: 0,
        },
      ]}
    />
  </>
)

const CopyFrame = ({ lines }: CopyFrameProps) =>
  lines.map(({ id, className, fade }) => (
    <span
      key={id}
      aria-hidden
      data-glyph-frame
      data-glyph-fade={fade}
      className={cn('pointer-events-none invisible absolute', className)}
    />
  ))

const HeroSearch = () => {
  const isMac = useSyncExternalStore(subscribeToNothing, getIsMac, getIsMacOnServer)

  return (
    <button
      type="button"
      data-warp-throat
      aria-keyshortcuts="Meta+K Control+K"
      onClick={openKbSearch}
      className={cn(
        'relative mt-2 flex h-12 w-full max-w-85 items-center gap-2.5 rounded-lg pl-3 pr-4 sm:max-w-107',
        'border border-default bg-surface-75 text-left text-base text-foreground-lighter shadow-raised',
        'transition-colors hover:border-strong hover:text-foreground-light focus-ring'
      )}
    >
      <Search aria-hidden className="size-4.5 shrink-0" strokeWidth={2.25} />
      <span className="flex-1 truncate">Search guides</span>
      <KeyboardShortcut keys={[isMac ? '⌘' : 'Ctrl', 'K']} />
    </button>
  )
}
