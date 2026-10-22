// NOTE: patch pushState before TanStack createBrowserHistory copies it, which is
// why _app and __root import this module. the installed flag lives on window
// because TanStack then replaces pushState with an unmarked wrapper. popstate
// also fires before the page chunk loads.

const TRAVERSE_STATE = '__studioHistoryTraverseState'

type TraverseState = {
  isInstalled: boolean
  isTraverseNavigation: boolean
  hasClientPush: boolean
}

function getTraverseState(): TraverseState {
  const host = window as Window & { [TRAVERSE_STATE]?: TraverseState }

  if (!host[TRAVERSE_STATE]) {
    host[TRAVERSE_STATE] = {
      isInstalled: false,
      isTraverseNavigation: false,
      hasClientPush: false,
    }
  }

  return host[TRAVERSE_STATE]
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
    return originalPushState(data, unused, url)
  }
}

let isShellReady = false

export function settleHistoryTraverseNavigation(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  // clear the popstate bit only. a document back_forward load stays a traverse
  // until a real pushState: next runs this from the app effect before the page
  // renders, so hiding that load here makes the editor miss it.
  state.isTraverseNavigation = false
}

// tanstack clientonly renders its fallback on the first hydrated commit, so a
// root effect can settle before the page reads the traverse flag.
export function markHistoryTraverseShellReady(): void {
  isShellReady = true
  settleHistoryTraverseNavigation()
}

export function scheduleHistoryTraverseSettlement(): void {
  if (!isShellReady) {
    return
  }

  setTimeout(settleHistoryTraverseNavigation, 0)
}

export function isHistoryTraverseNavigation(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const { isTraverseNavigation, hasClientPush } = getTraverseState()

  if (isTraverseNavigation) {
    return true
  }

  if (hasClientPush) {
    return false
  }

  const [entry] = performance.getEntriesByType('navigation')
  const isDocumentBackForward =
    entry !== undefined && 'type' in entry && entry.type === 'back_forward'
  return isDocumentBackForward
}

export function resetHistoryTraverseState(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  state.isTraverseNavigation = false
  state.hasClientPush = false
  isShellReady = false
}

installHistoryTraverseListener()
