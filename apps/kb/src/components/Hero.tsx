import { Check, Copy, Search } from 'lucide-react'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
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
import { WormholeCanvas } from './WormholeCanvas'

export interface HeroProps {
  guides: GuideSummary[]
  className?: string
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const HERO_VARIANTS = ['grid', 'wormhole', 'bend'] as const
const BEND_MAX_FLATTEN = 0.45

const CONTENT_MAX_WIDTH = 1152
const CONTENT_GUTTER = 24
const HERO_DECAY = 0.985

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: 'Search with your agent',
  copied: 'Copied',
  failed: "Couldn't copy",
}

const COPY_RESET_MS = 2000

const getHeroLattice = ({ width, height }: CanvasSize): Lattice => {
  const contentLeft = Math.max(0, (width - CONTENT_MAX_WIDTH) / 2) + CONTENT_GUTTER
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

const getIngestWords = (guides: GuideSummary[]) => [
  ...new Set(
    guides.flatMap((guide) =>
      guide.title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 5)
    )
  ),
]

const subscribeToNothing = () => () => {}

const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent)

const getIsMacOnServer = () => false

export const Hero = ({ guides, className }: HeroProps) => {
  const variant = useQueryVariant({ key: 'hero', options: HERO_VARIANTS, fallback: 'grid' })
  const isWormhole = variant !== 'grid'
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const copyRef = useRef<HTMLDivElement>(null)
  const isMac = useSyncExternalStore(subscribeToNothing, getIsMac, getIsMacOnServer)
  const ingestWords = getIngestWords(guides)

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
    <section
      className={cn(
        'relative isolate flex justify-center pb-78 pt-45.5',
        'in-data-[hero-kind=funnel]:mt-6.5 in-data-[hero-kind=funnel]:pb-84.5 in-data-[hero-kind=funnel]:pt-32.5',
        'overflow-hidden bg-background',
        className
      )}
    >
      {isWormhole ? (
        <WormholeCanvas
          anchorRef={copyRef}
          maxFlatten={variant === 'bend' ? BEND_MAX_FLATTEN : 1}
        />
      ) : (
        <AsciiCanvas
          getLattice={getHeroLattice}
          getField={heroField}
          keepOutRefs={[copyRef]}
          keepOutMargin={0}
          words={ingestWords}
          hasIdleShimmer
          isInteractive={false}
          decay={HERO_DECAY}
        />
      )}
      <div className="relative z-10 w-full max-w-6xl px-6">
        {isWormhole ? (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-1/2 top-1/2 -z-10 h-100 w-205 max-w-screen',
              '-translate-x-1/2 -translate-y-1/2',
              'bg-radial-[closest-side] from-background/95 via-background/80 via-65% to-transparent'
            )}
          />
        ) : null}
        <div ref={copyRef} className="flex flex-col items-center gap-5 py-16 text-center">
          <h1 className="m-0 text-5xl tracking-[-0.03em] text-foreground sm:text-6xl">
            <AsciiHoverText text="Knowledge base" glyphClassName="after:text-foreground" />
          </h1>
          <p className="m-0 max-w-145 text-balance text-lg leading-7 text-foreground-light">
            In-depth guides, tutorials, and explainers for best practices for Supabase databases
          </p>
          <button
            ref={bindSearchShortcut}
            type="button"
            data-wormhole-throat
            aria-keyshortcuts="Meta+K Control+K"
            onClick={handleSearchOpen}
            className={cn(
              'relative mt-2 flex h-12 w-full max-w-85 items-center gap-2.5 rounded-lg pl-3 pr-4 sm:max-w-107',
              'border border-default bg-surface-75 text-left text-base text-foreground-lighter shadow-codeblock',
              'transition-colors hover:border-strong hover:text-foreground-light focus-ring'
            )}
          >
            <Search aria-hidden className="size-4.5 shrink-0" strokeWidth={2.25} />
            <span className="flex-1 truncate">Search guides</span>
            <KeyboardShortcut keys={[isMac ? '⌘' : 'Ctrl', 'K']} />
          </button>
          <AgentPromptButton />
        </div>
      </div>
      {isWormhole ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-background"
        />
      )}
      <GuideSearchDialog guides={guides} isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </section>
  )
}

const AgentPromptButton = () => {
  const [status, setStatus] = useState<CopyStatus>('idle')

  const handleCopy = async () => {
    const indexUrl = new URL(`${import.meta.env.BASE_URL}/llms.txt`, window.location.origin)
    const prompt = `Read ${indexUrl.href}, the index of Supabase Knowledge Base guides, then fetch the markdown of the guides relevant to my task.`
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    window.setTimeout(() => setStatus('idle'), COPY_RESET_MS)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-sm text-sm text-foreground-lighter transition-colors hover:text-foreground-light focus-ring"
    >
      {status === 'copied' ? (
        <Check aria-hidden className="size-3.5" strokeWidth={2.25} />
      ) : (
        <Copy aria-hidden className="size-3.5" strokeWidth={2.25} />
      )}
      <span aria-live="polite">{COPY_LABELS[status]}</span>
    </button>
  )
}
