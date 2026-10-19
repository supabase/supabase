// Back/Forward commit through popstate on both the Next pages router and TanStack.
// A full document restore never fires that event in the new document, but
// PerformanceNavigationTiming reports it as `back_forward` for the whole
// session — ignore that once the user has pushed a new entry.

let isTraverseNavigation = false
let hasClientPush = false
let isListening = false

export function installHistoryTraverseListener(): void {
  if (isListening || typeof window === 'undefined') {
    return
  }

  isListening = true

  window.addEventListener('popstate', () => {
    isTraverseNavigation = true
  })

  const originalPushState = history.pushState.bind(history)
  history.pushState = (data, unused, url) => {
    isTraverseNavigation = false
    hasClientPush = true
    return originalPushState(data, unused, url)
  }
}

export function isHistoryTraverseNavigation(): boolean {
  installHistoryTraverseListener()

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
  isTraverseNavigation = false
  hasClientPush = false
}

installHistoryTraverseListener()
