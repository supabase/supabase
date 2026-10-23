// router.tsx imports this before createRouter copies pushState. the flag lives
// on window because that copy is an unmarked wrapper, and popstate fires
// before the page chunk loads.

interface HistoryTraverseState {
  isInstalled: boolean
  isTraverseNavigation: boolean
  isShellReady: boolean
  // no url listener. the patched pushState sets this, and a read sets it when
  // location.href no longer matches the document back-forward entry.
  // a same-url visit that skips pushState leaves it unset, so repeated reads
  // on that url stay true (the editor can remount).
  documentConsumed: boolean
}

declare global {
  interface Window {
    __studioHistoryTraverseState?: HistoryTraverseState
  }
}

function getTraverseState(): HistoryTraverseState {
  if (!window.__studioHistoryTraverseState) {
    window.__studioHistoryTraverseState = {
      isInstalled: false,
      isTraverseNavigation: false,
      isShellReady: false,
      documentConsumed: false,
    }
  }

  return window.__studioHistoryTraverseState
}

function isNavigationTiming(entry: unknown): entry is PerformanceNavigationTiming {
  if (
    typeof PerformanceNavigationTiming !== 'undefined' &&
    entry instanceof PerformanceNavigationTiming
  ) {
    return true
  }

  // jsdom has no PerformanceNavigationTiming, so tests pass a plain entry
  if (typeof entry !== 'object' || entry === null) return false
  if (!('type' in entry) || !('name' in entry)) return false
  if (typeof entry.name !== 'string' || typeof entry.type !== 'string') return false

  return (
    entry.type === 'navigate' ||
    entry.type === 'reload' ||
    entry.type === 'back_forward' ||
    entry.type === 'prerender'
  )
}

function getNavigationTiming(): PerformanceNavigationTiming | undefined {
  const [entry] = performance.getEntriesByType('navigation')
  if (entry && isNavigationTiming(entry)) return entry
  return undefined
}

export function installHistoryTraverseListener(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  const isAlreadyInstalled = state.isInstalled

  if (isAlreadyInstalled) {
    return
  }

  state.isInstalled = true

  window.addEventListener('popstate', () => {
    state.isTraverseNavigation = true
  })

  const originalPushState = history.pushState.bind(history)
  history.pushState = (data, unused, url) => {
    state.isTraverseNavigation = false
    // a client push is a new visit, so a later read must not reuse this document's back-forward
    state.documentConsumed = true
    return originalPushState(data, unused, url)
  }
}

export function settleHistoryTraverseNavigation(): void {
  if (typeof window === 'undefined') {
    return
  }

  // clear only the popstate bit. a document back-forward stays until the editor
  // reads it, because this can run before that render.
  getTraverseState().isTraverseNavigation = false
}

export function markHistoryTraverseShellReady(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  state.isShellReady = true
  settleHistoryTraverseNavigation()
}

// settle once the shell has painted. a timer can clear the popstate bit before
// a transition-deferred render reads it.
export function scheduleHistoryTraverseSettlement(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!getTraverseState().isShellReady) {
    return
  }

  settleHistoryTraverseNavigation()
}

function readDocumentBackForward(state: HistoryTraverseState): boolean {
  if (state.documentConsumed) return false

  const entry = getNavigationTiming()
  if (!entry || entry.type !== 'back_forward') return false

  // don't consume a match. a remount on this url has to see the same traverse.
  if (entry.name !== window.location.href) {
    state.documentConsumed = true
    return false
  }

  return true
}

export function isHistoryTraverseNavigation(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const state = getTraverseState()

  if (state.isTraverseNavigation) {
    return true
  }

  return readDocumentBackForward(state)
}

installHistoryTraverseListener()
