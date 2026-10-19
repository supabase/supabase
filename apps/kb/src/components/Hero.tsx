import { Search } from 'lucide-react'
import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import {
  alignedEdges,
  CELL_HEIGHT,
  CELL_WIDTH,
  heroField,
  uniformEdges,
  type Lattice,
} from '../lib/ascii/field'
import type { GuideSummary } from '../lib/guides'
import { useQueryVariant } from '../lib/use-query-variant'
import { AsciiCanvas, type CanvasSize } from './AsciiCanvas'
import { AsciiHoverText } from './AsciiHoverText'
import { GuideSearchDialog } from './GuideSearchDialog'
import { WarpCanvas } from './WarpCanvas'

export interface HeroProps {
  title: string
  description: string
  guides: GuideSummary[]
  breadcrumb?: ReactNode
  variant?: 'grid' | 'warp'
  children?: ReactNode
  className?: string
}

export interface HomeHeroProps {
  guides: GuideSummary[]
  className?: string
}

interface HeroSearchProps {
  guides: GuideSummary[]
}

// hidden for launch. preview with ?search=on, flip the fallback to ship it
const SEARCH_FLAG = ['off', 'on'] as const

const getHeroLattice = ({ width, height }: CanvasSize): Lattice => {
  const contentLeft = Math.max(0, (width - 1152) / 2) + 24
  return {
    xs: alignedEdges({
      size: width,
      start: contentLeft,
      end: width - contentLeft,
      target: CELL_WIDTH,
    }),
    ys: uniformEdges({ size: height, step: CELL_HEIGHT }),
  }
}

const subscribeToNothing = () => () => {}

const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent)

const getIsMacOnServer = () => false

export const Hero = ({
  title,
  description,
  guides,
  breadcrumb,
  variant = 'warp',
  children,
  className,
}: HeroProps) => {
  const isWarp = variant === 'warp'
  const copyRef = useRef<HTMLDivElement>(null)
  const ingestWords = [
    ...new Set(
      guides.flatMap((guide) =>
        guide.title
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((word) => word.length >= 5)
      )
    ),
  ]

  return (
    <section
      className={cn(
        'relative isolate flex justify-center',
        isWarp ? 'mt-6.5 pt-32.5 pb-78' : 'pt-32.5 pb-39 max-sm:pt-19.5 max-sm:pb-19.5',
        'overflow-hidden bg-background',
        className
      )}
    >
      {isWarp ? (
        <WarpCanvas anchorRef={copyRef} />
      ) : (
        <AsciiCanvas
          getLattice={getHeroLattice}
          getField={heroField}
          keepOutRefs={[copyRef]}
          keepOutMargin={0}
          words={ingestWords}
          decay={0.985}
        />
      )}
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
            'flex flex-col items-center gap-5 text-center',
            isWarp ? 'py-16' : 'pt-12 pb-9.5'
          )}
        >
          {breadcrumb}
          <h1 className="m-0 text-5xl tracking-display text-foreground sm:text-6xl">
            <AsciiHoverText text={title} glyphClassName="after:text-foreground" />
          </h1>
          <p className="m-0 min-h-[2lh] max-w-145 text-balance text-lg leading-7 text-foreground-light">
            {description}
          </p>
          {children}
        </div>
      </div>
      {isWarp ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-background"
        />
      )}
    </section>
  )
}

export const HomeHero = ({ guides, className }: HomeHeroProps) => {
  const isSearchEnabled =
    useQueryVariant({ key: 'search', options: SEARCH_FLAG, fallback: 'off' }) === 'on'

  return (
    <Hero
      title="Knowledge base"
      description="In-depth guides, tutorials, troubleshooting, and explainers for best practices for Supabase"
      guides={guides}
      className={className}
    >
      {isSearchEnabled ? <HeroSearch guides={guides} /> : null}
    </Hero>
  )
}

const HeroSearch = ({ guides }: HeroSearchProps) => {
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
      <GuideSearchDialog guides={guides} isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
