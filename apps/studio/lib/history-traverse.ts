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

export function settleHistoryTraverseNavigation(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getTraverseState()
  state.isTraverseNavigation = false
  state.hasClientPush = true
}

export function scheduleHistoryTraverseSettlement(): void {
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
}

installHistoryTraverseListener()
