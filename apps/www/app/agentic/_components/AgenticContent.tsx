'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import { EVALS_DRAWING, IsoArt, TimelineRing } from './art'
import { STAGES, type Primitive } from './content'
import { Conversation } from './Conversation'
import { LifecycleCube } from './LifecycleCube'
import DefaultLayout from '@/components/Layouts/Default'

const PANEL_ID = 'primitive-panel'
const PRIMITIVES = STAGES.flatMap((stage) => stage.primitives)

const rowId = (primitiveId: string) => `primitive-row-${primitiveId}`

const HEADLINE = 'Idea to production and back again'
const LEAD =
  'Supabase gives your agent everything it needs to build, deploy, and operate your software.'

// The knowledge base's heading scale. Only the page title keeps the heading family: section and
// panel titles are the body family, one step larger than the text. www has no tokens for these
// tracking values, and arbitrary ones fail the lint ratchet.
const DISPLAY_STYLE = { letterSpacing: '-0.03em' }
const TITLE_STYLE = { fontFamily: 'inherit', letterSpacing: '-0.015em' }

// CSS only, so the hero is already moving before the page hydrates, and it holds its starting state
// through its delay without any script
const HERO_REVEAL =
  'animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-700 ease-out motion-reduce:animate-none'

// Primitives, and a primitive's details and conversation, sit on top of each other and slide past
// one another. The old one leaves quickly and the new one waits a moment, so their text never
// overlaps. Visibility only transitions on the way out, for the same reason as the panel itself.
// Tailwind's translate classes set the `translate` property, so that's the one to transition, not
// `transform`.
const SLIDE = 'absolute inset-0 ease-out motion-reduce:transition-none'
const SLIDE_SHOWN = 'translate-x-0 opacity-100 transition-[opacity,translate] delay-75 duration-300'
const SLIDE_HIDDEN = 'invisible opacity-0 transition-[opacity,translate,visibility] duration-150'
const PANEL_PAGE = cn(SLIDE, 'flex flex-col')

const PANEL_ICON_BUTTON =
  'p-1 text-foreground-lighter transition-colors hover:text-foreground aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:text-foreground-lighter'

// Every row shares one grid, so names and summaries line up down the page
const COLUMNS = 'grid min-w-0 flex-1 gap-x-6 sm:grid-cols-[10rem_minmax(0,1fr)]'

function PrimitiveRow({
  primitive,
  selected,
  onSelect,
}: {
  primitive: Primitive
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      id={rowId(primitive.id)}
      tabIndex={0}
      type="button"
      aria-expanded={selected}
      aria-controls={PANEL_ID}
      onClick={onSelect}
      className="group/row flex w-full scroll-mt-20 scroll-mb-6 items-start gap-4 border-t border-muted py-3 text-left"
    >
      <span className={COLUMNS}>
        <span className="text-foreground">{primitive.name}</span>
        <span
          className={cn(
            'transition-colors group-hover/row:text-foreground',
            selected ? 'text-foreground' : 'text-foreground-light'
          )}
        >
          {primitive.summary}
        </span>
      </span>
      <ChevronRightIcon
        aria-hidden
        size={16}
        strokeWidth={1.5}
        className={cn(
          'mt-1 flex-none transition-[color,translate] duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-foreground motion-reduce:transition-none',
          selected ? 'translate-x-0.5 text-foreground' : 'text-foreground-lighter'
        )}
      />
    </button>
  )
}

function PanelContent({
  primitive,
  active,
  isBeforeActive,
  chatting,
  onChattingChange,
}: {
  primitive: Primitive
  active: boolean
  isBeforeActive: boolean
  chatting: boolean
  onChattingChange: (chatting: boolean) => void
}) {
  const seeExample = useRef<HTMLButtonElement>(null)
  const back = useRef<HTMLButtonElement>(null)
  const wasChatting = useRef(chatting)

  // Waits for the commit, because neither button can take focus while its page is still inert
  useEffect(() => {
    if (wasChatting.current === chatting) return
    wasChatting.current = chatting
    if (active) (chatting ? back : seeExample).current?.focus({ preventScroll: true })
  }, [chatting, active])

  return (
    <article
      inert={!active}
      className={cn(
        SLIDE,
        active && SLIDE_SHOWN,
        !active && SLIDE_HIDDEN,
        !active && (isBeforeActive ? '-translate-x-6' : 'translate-x-6')
      )}
    >
      <div
        inert={chatting}
        className={cn(PANEL_PAGE, chatting ? cn(SLIDE_HIDDEN, '-translate-x-6') : SLIDE_SHOWN)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
          <h3 className="pr-20 text-xl font-medium text-foreground" style={TITLE_STYLE}>
            {primitive.name}
          </h3>
          <IsoArt
            drawing={primitive.drawing}
            text={`${primitive.name} + ${primitive.description} + `}
            playing={active}
            surface="caret-background-surface-75"
            className="my-4 h-32"
          />
          <p className="text-foreground-light">{primitive.description}</p>
          <dl className="mt-6">
            {primitive.offers.map((offer) => (
              <div key={offer.title} className="border-t border-muted py-3">
                <dt className="text-foreground">{offer.title}</dt>
                <dd className="text-foreground-light">{offer.description}</dd>
              </div>
            ))}
          </dl>
          <div className="sticky bottom-0 -mx-6 bg-linear-to-t from-background-surface-75 from-80% to-transparent px-6 pt-6 pb-5">
            <Button
              ref={seeExample}
              block
              size="medium"
              className="text-lg"
              iconRight={<ChevronRightIcon aria-hidden strokeWidth={1.5} />}
              onClick={() => onChattingChange(true)}
            >
              Example agent interaction
            </Button>
          </div>
        </div>
      </div>

      <div
        inert={!chatting}
        className={cn(PANEL_PAGE, chatting ? SLIDE_SHOWN : cn(SLIDE_HIDDEN, 'translate-x-6'))}
      >
        <div className="px-6 pt-5 pb-3">
          <button
            ref={back}
            tabIndex={0}
            type="button"
            aria-label={`Back to ${primitive.name}`}
            onClick={() => onChattingChange(false)}
            className="-ml-1 flex items-center gap-1 p-1 text-foreground-light transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon aria-hidden size={16} strokeWidth={1.5} />
            {primitive.name}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">
          <Conversation messages={primitive.conversation} playing={active && chatting} />
        </div>
      </div>
    </article>
  )
}

export function AgenticContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Shared by every primitive, so moving along the journey stays on the same kind of view
  const [isChatting, setIsChatting] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const shouldFocusPanel = useRef(false)

  const activeIndex = PRIMITIVES.findIndex((primitive) => primitive.id === selectedId)
  const isOpen = activeIndex >= 0
  const previous = isOpen ? PRIMITIVES[activeIndex - 1] : undefined
  const next = isOpen ? PRIMITIVES[activeIndex + 1] : undefined

  // Rows are found by id because moving along the journey can change which one is current
  const close = useCallback(() => {
    if (selectedId) document.getElementById(rowId(selectedId))?.focus({ preventScroll: true })
    setSelectedId(null)
  }, [selectedId])

  const select = (id: string) => {
    if (id === selectedId) return close()
    shouldFocusPanel.current = true
    setIsChatting(false)
    setSelectedId(id)
  }

  const goTo = useCallback((primitive: Primitive) => {
    setSelectedId(primitive.id)
    // The list follows along, so the page shows where you are in the journey
    document.getElementById(rowId(primitive.id))?.scrollIntoView({ block: 'nearest' })
  }, [])

  // Keyboard and screen reader users land in what they just opened. This waits for the commit,
  // because the panel can't take focus while it's still inert.
  useEffect(() => {
    if (!shouldFocusPanel.current) return
    shouldFocusPanel.current = false
    panel.current?.focus({ preventScroll: true })
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // One step at a time: back to the details first, and only then close the panel
        if (isChatting) setIsChatting(false)
        else close()
        return
      }

      // Modified arrows belong to the browser, like Alt+Left for going back a page
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable]')) return

      const destination =
        (event.key === 'ArrowLeft' && previous) || (event.key === 'ArrowRight' && next)
      if (!destination) return
      // Focus inside the current primitive is about to go inert, so it moves up to the panel
      shouldFocusPanel.current = !!document.activeElement?.closest('article')
      goTo(destination)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, isChatting, close, goTo, previous, next])

  return (
    <DefaultLayout>
      <div
        className={cn(
          'text-lg leading-snug transition-[padding] duration-300 ease-out motion-reduce:transition-none',
          isOpen && 'lg:pr-108'
        )}
      >
        <header className="relative flex items-center justify-center overflow-x-clip px-6 py-4 sm:py-8">
          {/* Sized to clear the copy, so on a phone its sides run off the page */}
          <TimelineRing
            text={`${HEADLINE} + ${LEAD} + `}
            className="pointer-events-none absolute top-1/2 left-1/2 size-132 -translate-x-1/2 -translate-y-1/2 sm:size-176"
          />
          {/* The copy is widest at the bottom, so it sits a little above the ring's center */}
          <div className="relative flex h-132 flex-col items-center justify-center pb-6 text-center sm:h-176 sm:pb-10">
            <LifecycleCube
              text="Your Supabase project + "
              className={cn('mb-6 h-24 sm:mb-8 sm:h-36', HERO_REVEAL)}
            />
            <h1 className="text-4xl leading-none font-semibold sm:text-6xl" style={DISPLAY_STYLE}>
              <span
                className={cn('block text-foreground', HERO_REVEAL)}
                style={{ animationDelay: '150ms' }}
              >
                Idea to production
              </span>
              <span
                className={cn('block text-foreground-lighter', HERO_REVEAL)}
                style={{ animationDelay: '250ms' }}
              >
                and back again
              </span>
            </h1>
            <p
              className={cn(
                'mt-5 max-w-145 text-balance leading-7 text-foreground-light',
                HERO_REVEAL
              )}
              style={{ animationDelay: '400ms' }}
            >
              {LEAD}
            </p>
          </div>
        </header>

        <div className="mx-auto w-full max-w-2xl px-6 pt-10 sm:pt-14">
          {STAGES.map((stage) => (
            <section key={stage.id} id={stage.id} className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-xl font-medium text-tertiary-foreground" style={TITLE_STYLE}>
                {stage.title}
              </h2>
              <div className="border-b border-muted">
                {stage.primitives.map((primitive) => (
                  <PrimitiveRow
                    key={primitive.id}
                    primitive={primitive}
                    selected={selectedId === primitive.id}
                    onSelect={() => select(primitive.id)}
                  />
                ))}
              </div>
            </section>
          ))}

          <footer className="pb-14">
            {/* The evals are a separate app behind a rewrite, so this is a full page load */}
            <a
              href="/evals"
              className="group/card flex items-center gap-6 rounded-xl border border-default bg-surface-75 p-6 transition-colors hover:border-strong"
            >
              {/* Phones hide it, because it would squeeze the text */}
              <IsoArt
                drawing={EVALS_DRAWING}
                text="Supabase Evals + Build + Deploy + Investigate + Resolve + "
                surface="caret-background-surface-75"
                className="hidden h-24 w-28 flex-none sm:block"
              />
              <span className="min-w-0 flex-1">
                <h2 className="text-xl font-medium text-foreground" style={TITLE_STYLE}>
                  Proven by evals
                </h2>
                <span className="mt-2 block text-foreground-light">
                  Supabase Evals is our open-source benchmark. Agents get a realistic project and
                  are scored on how well they build, deploy, and operate.
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                size={16}
                strokeWidth={1.5}
                className="mt-1.5 flex-none self-start text-foreground-lighter transition-[color,translate] duration-200 group-hover/card:translate-x-0.5 group-hover/card:text-foreground motion-reduce:transition-none"
              />
            </a>
          </footer>
        </div>
      </div>

      {/* Every primitive stays in the document, so the HTML reads in full without running it */}
      <aside
        id={PANEL_ID}
        ref={panel}
        tabIndex={-1}
        aria-label="Primitive details"
        inert={!isOpen}
        className={cn(
          'fixed inset-x-2 top-20 bottom-2 z-30 overflow-clip rounded-xl border border-default bg-surface-75 text-lg leading-snug outline-hidden duration-300 ease-out motion-reduce:transition-none lg:inset-x-auto lg:top-20 lg:right-4 lg:bottom-4 lg:w-104',
          // Clipped rather than hidden: a hidden box can still be scrolled by script, and the slides
          // reach past its edges, so following a conversation could shift the whole panel sideways.
          // Visibility only transitions on the way out. It would still read as hidden on the first
          // frame of opening, and the panel couldn't take focus.
          isOpen
            ? 'translate-x-0 opacity-100 transition-[opacity,translate]'
            : 'invisible translate-y-3 opacity-0 transition-[opacity,translate,visibility] lg:translate-x-3 lg:translate-y-0'
        )}
      >
        <div className="absolute inset-0">
          {PRIMITIVES.map((primitive, index) => (
            <PanelContent
              key={primitive.id}
              primitive={primitive}
              active={index === activeIndex}
              isBeforeActive={index < activeIndex}
              chatting={isChatting}
              onChattingChange={setIsChatting}
            />
          ))}
        </div>

        <span aria-live="polite" className="sr-only">
          {PRIMITIVES[activeIndex]?.name}
        </span>

        <div className="absolute top-5 right-5 flex items-center gap-1">
          {/* Stay focusable at either end, so repeated presses don't drop focus out of the panel */}
          <button
            tabIndex={0}
            type="button"
            aria-label={previous ? `Previous: ${previous.name}` : 'Previous'}
            aria-disabled={!previous}
            aria-keyshortcuts="ArrowLeft"
            onClick={() => previous && goTo(previous)}
            className={PANEL_ICON_BUTTON}
          >
            <ArrowLeftIcon aria-hidden size={16} strokeWidth={1.5} />
          </button>
          <button
            tabIndex={0}
            type="button"
            aria-label={next ? `Next: ${next.name}` : 'Next'}
            aria-disabled={!next}
            aria-keyshortcuts="ArrowRight"
            onClick={() => next && goTo(next)}
            className={PANEL_ICON_BUTTON}
          >
            <ArrowRightIcon aria-hidden size={16} strokeWidth={1.5} />
          </button>
          <button
            tabIndex={0}
            type="button"
            aria-label="Close"
            onClick={close}
            className={PANEL_ICON_BUTTON}
          >
            <XIcon aria-hidden size={16} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </DefaultLayout>
  )
}
