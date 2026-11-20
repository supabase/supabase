import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'

/** `polite` waits for the screen reader to finish; `assertive` interrupts. */
export type Politeness = 'polite' | 'assertive'

export interface AnnouncerHandle {
  announce(message: string, politeness?: Politeness): void
}

/**
 * Screen reader live regions, hidden visually. Screen readers only announce
 * changes to a live region that was already in the DOM, so these are rendered
 * once, empty, and only their text is changed, through the handle.
 */
export function Announcer({ ref }: { ref: Ref<AnnouncerHandle> }) {
  const polite = useRef<HTMLDivElement>(null)
  const assertive = useRef<HTMLDivElement>(null)
  const pending = useRef<Record<Politeness, number | undefined>>({
    polite: undefined,
    assertive: undefined,
  })

  useImperativeHandle(
    ref,
    () => ({
      announce(message, politeness = 'polite') {
        const region = (politeness === 'assertive' ? assertive : polite).current
        if (!region) return
        // Clear, then set on the next frame, so a message that repeats the
        // previous one is still announced. A newer message replaces a pending one.
        const previous = pending.current[politeness]
        if (previous !== undefined) cancelAnimationFrame(previous)
        region.textContent = ''
        pending.current[politeness] = requestAnimationFrame(() => {
          region.textContent = message
        })
      },
    }),
    []
  )

  return (
    <>
      <div ref={polite} className="sr-only" role="status" />
      <div ref={assertive} className="sr-only" role="alert" />
    </>
  )
}

const AnnounceContext = createContext<AnnouncerHandle['announce'] | null>(null)

/**
 * Mounts one `Announcer` before anything else renders and gives descendants
 * its `announce` through `useAnnounce`. Hosts render it once, around a view
 * whose status changes while the user is elsewhere on the page.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const handle = useRef<AnnouncerHandle>(null)
  const announce = useCallback<AnnouncerHandle['announce']>(
    (message, politeness) => handle.current?.announce(message, politeness),
    []
  )

  return (
    <AnnounceContext value={announce}>
      <Announcer ref={handle} />
      {children}
    </AnnounceContext>
  )
}

/** `announce(message, politeness)`. Call it from events or effects. */
export function useAnnounce() {
  const announce = useContext(AnnounceContext)
  if (!announce) throw new Error('useAnnounce needs an AnnouncerProvider')
  return announce
}

/**
 * Announces `message` whenever it changes, for text derived from state (e.g.
 * the current step). Nothing is announced while it is empty. For events, such
 * as a button's result, call `useAnnounce()` from the handler instead, so a
 * repeated result is announced again.
 */
export function useAnnouncement(message: string | undefined, politeness: Politeness = 'polite') {
  const announce = useAnnounce()
  useEffect(() => {
    if (message) announce(message, politeness)
  }, [announce, message, politeness])
}
