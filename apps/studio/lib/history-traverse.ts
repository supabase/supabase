// NOTE: patch pushState before TanStack createBrowserHistory copies it, which is
// why _app and __root import this module. popstate also fires before the page chunk loads.

const PATCHED_PUSH_STATE = '__studioHistoryTraversePatched'
const TRAVERSE_STATE = '__studioHistoryTraverseState'

type TraverseState = {
  isTraverseNavigation: boolean
  hasClientPush: boolean
}

type PatchedPushState = History['pushState'] & { [PATCHED_PUSH_STATE]?: true }

function getTraverseState(): TraverseState {
  const host = window as Window & { [TRAVERSE_STATE]?: TraverseState }

  if (!host[TRAVERSE_STATE]) {
    host[TRAVERSE_STATE] = { isTraverseNavigation: false, hasClientPush: false }
  }

  return host[TRAVERSE_STATE]
}

export function installHistoryTraverseListener(): void {
  if (typeof window === 'undefined') {
    return
  }

  const currentPushState = history.pushState as PatchedPushState
  const isAlreadyPatched = currentPushState[PATCHED_PUSH_STATE] === true

  if (isAlreadyPatched) {
    return
  }

  window.addEventListener('popstate', () => {
    getTraverseState().isTraverseNavigation = true
  })

  const originalPushState = history.pushState.bind(history)
  const patchedPushState: PatchedPushState = (data, unused, url) => {
    const state = getTraverseState()
    state.isTraverseNavigation = false
    state.hasClientPush = true
    return originalPushState(data, unused, url)
  }
  patchedPushState[PATCHED_PUSH_STATE] = true
  history.pushState = patchedPushState
}

export function isHistoryTraverseNavigation(): boolean {
  installHistoryTraverseListener()

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
