import { Search } from 'lucide-react'
import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import type { Topic } from '../lib/topics'
import { AsciiHoverText } from './AsciiHoverText'
import { HeroGrid } from './HeroGrid'
import { InfallText } from './InfallText'
import { KbSearchDialog } from './KbSearchDialog'
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
  lines: { id: string; className: string }[]
}

interface HeroFlanksProps {
  topic: Topic
}

export interface HomeHeroProps {
  className?: string
}

const DRAW_OUT = 'motion-safe:animate-draw-out'

const FLANK_BOX = cn(
  'grain-mask-flank absolute -top-[100vh] h-[calc(100%+200vh)] w-[50vw]',
  'pointer-events-none py-[100vh] pl-12 pr-92 max-lg:hidden'
)

const ACROSS = 'left-1/2 h-px w-screen -translate-x-1/2 bg-border'
const UPRIGHT =
  'inset-y-0 w-px origin-top bg-linear-to-b from-border via-border via-70% to-transparent'

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
  const copyRef = useRef<HTMLDivElement>(null)

  return (
    <section
      className={cn(
        'relative isolate flex justify-center',
        isWarp ? 'pt-39 pb-60' : 'max-lg:py-10 max-lg:border-b lg:pt-32.5 lg:pb-40',
        'overflow-hidden bg-background',
        className
      )}
    >
      {isWarp ? <WarpCanvas anchorRef={copyRef} /> : null}
      {variant === 'construction' ? (
        <CopyFrame
          lines={[
            {
              id: 'left',
              className: cn('right-[calc(50%+20rem)] max-lg:hidden', UPRIGHT, DRAW_OUT),
            },
            {
              id: 'right',
              className: cn('left-[calc(50%+20rem)] max-lg:hidden', UPRIGHT, DRAW_OUT),
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
            <TopicShape topic={topic} className="grain-mask h-45 w-full lg:hidden" />
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
          {variant === 'construction' && topic ? <HeroFlanks topic={topic} /> : null}
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

const HeroFlanks = ({ topic }: HeroFlanksProps) => (
  <>
    <HeroGrid axis="rows" className={cn('right-1/2', FLANK_BOX)} />
    <HeroGrid axis="rows" className={cn('left-1/2 -scale-x-100', FLANK_BOX)} />
    <HeroGrid
      axis="columns"
      className={cn('right-1/2 [--flank-span:calc(100%_-_20rem)]', FLANK_BOX)}
    />
    <HeroGrid
      axis="columns"
      className={cn('left-1/2 -scale-x-100 [--flank-span:calc(100%_-_20rem)]', FLANK_BOX)}
    />
    <TopicShape topic={topic} className={cn('right-1/2', FLANK_BOX)} />
    <TopicShape topic={topic} className={cn('left-1/2 -scale-x-100', FLANK_BOX)} />
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
          className: cn('bottom-full left-1/2 h-screen w-px origin-bottom bg-border', DRAW_OUT),
        },
        {
          id: 'tail',
          className: cn(
            'top-full left-1/2 h-40 w-px origin-top bg-linear-to-b from-border to-transparent',
            'max-lg:bg-border max-lg:bg-none',
            DRAW_OUT
          ),
        },
      ]}
    />
  </>
)

const CopyFrame = ({ lines }: CopyFrameProps) =>
  lines.map(({ id, className }) => (
    <span
      key={id}
      aria-hidden
      className={cn('grain-mask pointer-events-none absolute', className)}
    />
  ))

const HeroSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isMac = useSyncExternalStore(subscribeToNothing, getIsMac, getIsMacOnServer)

  const bindSearchShortcut = useCallback((trigger: HTMLButtonElement | null) => {
    if (!trigger) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key?.toLowerCase() !== 'k') return
      if (!(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      setIsSearchOpen((isOpen) => !isOpen)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchOpen = () => setIsSearchOpen(true)

  return (
    <>
      <button
        ref={bindSearchShortcut}
        type="button"
        data-warp-throat
        aria-keyshortcuts="Meta+K Control+K"
        onClick={handleSearchOpen}
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
      <KbSearchDialog isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
