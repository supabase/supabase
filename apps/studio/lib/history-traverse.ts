// NOTE: router.tsx imports this module before createRouter reaches TanStack
// createBrowserHistory, which copies pushState. The flag lives on window
// because that copy is an unmarked wrapper. popstate also fires before the
// page chunk loads.

const TRAVERSE_STATE = '__studioHistoryTraverseState'

type TraverseState = {
  isInstalled: boolean
  isTraverseNavigation: boolean
  hasClientPush: boolean
  isShellReady: boolean
  // The document back-forward entry is only a traverse on its own URL, and only
  // until something reads it. A later replace or same-URL push (Next skips
  // pushState when the URL is unchanged) must not skip the redirect.
  documentConsumed: boolean
  latchedHref: string | null
  latchedValue: boolean | null
}

function getTraverseState(): TraverseState {
  const host = window as Window & { [TRAVERSE_STATE]?: TraverseState }

  if (!host[TRAVERSE_STATE]) {
    host[TRAVERSE_STATE] = {
      isInstalled: false,
      isTraverseNavigation: false,
      hasClientPush: false,
      isShellReady: false,
      documentConsumed: false,
      latchedHref: null,
      latchedValue: null,
    }
  }

  return host[TRAVERSE_STATE]
}

function isNavigationTiming(entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  if (
    typeof PerformanceNavigationTiming !== 'undefined' &&
    entry instanceof PerformanceNavigationTiming
  ) {
    return true
  }

  // jsdom does not implement PerformanceNavigationTiming, so unit tests pass a
  // plain entry. The discriminant is the navigation type.
  if (!('type' in entry) || typeof entry.name !== 'string') return false

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
    state.hasClientPush = true
    state.latchedHref = null
    state.latchedValue = null
    return originalPushState(data, unused, url)
  }
}

export function settleHistoryTraverseNavigation(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Clear the popstate bit only. A document back-forward load stays latched
  // until the next navigation: settling here also runs before a deferred
  // page render, and hiding that load would make the editor miss it.
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

// Settle immediately once the shell has painted. A timer can run before a
// transition-deferred render and clear the popstate bit first.
export function scheduleHistoryTraverseSettlement(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!getTraverseState().isShellReady) {
    return
  }

  settleHistoryTraverseNavigation()
}

// Drop the latched document decision so the next read runs again. Call this
// from the start of a client navigation, including a same-URL push that never
// hits pushState. The editor's first read on a document load happens before
// that event, so this does not hide the load it is already on.
export function clearHistoryTraverseLatch(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  state.latchedHref = null
  state.latchedValue = null
}

function readDocumentBackForward(state: TraverseState): boolean {
  if (state.documentConsumed) return false

  const entry = getNavigationTiming()
  if (!entry || entry.type !== 'back_forward') return false

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

  if (state.hasClientPush) {
    return false
  }

  const href = window.location.href
  if (state.latchedHref === href && state.latchedValue !== null) {
    return state.latchedValue
  }

  const isDocumentBackForward = readDocumentBackForward(state)
  state.latchedHref = href
  state.latchedValue = isDocumentBackForward
  if (isDocumentBackForward) {
    state.documentConsumed = true
  }
  return isDocumentBackForward
}

// The editor calls this after it has copied the flag into its decision, so a
// cancelled or settled popstate cannot leak into the next project.
export function acknowledgeHistoryTraverse(): void {
  settleHistoryTraverseNavigation()
}

export function resetHistoryTraverseState(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  state.isTraverseNavigation = false
  state.hasClientPush = false
  state.isShellReady = false
  state.documentConsumed = false
  state.latchedHref = null
  state.latchedValue = null
}

installHistoryTraverseListener()
