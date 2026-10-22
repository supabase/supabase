export type PanelEntryOwnership = {
  entryKey: string
  index: number | null
  pathname: string
  searchWithoutPanel: string
  hash: string
  href: string
}

export type PanelHistoryAction = 'push' | 'replace' | 'replace-clear' | 'dismiss'

export function isPanelValueClear(value: unknown) {
  return value == null || value === false || value === ''
}

function isUpdater<T>(next: T | ((current: T) => T)): next is (current: T) => T {
  return typeof next === 'function'
}

/** Resolve nuqs' function form before choosing push, replace, or dismiss. */
export function resolvePanelUpdater<T>(currentValue: T, next: T | ((current: T) => T)): T {
  if (isUpdater(next)) return next(currentValue)
  return next
}

/**
 * Push only while a cleared param becomes a value and the effective history
 * is push. A later value (row switch) replaces. An explicit replace clear
 * drops ownership and never goes back.
 */
export function panelHistoryAction({
  currentValue,
  nextValue,
  requestedHistory,
  parserHistory,
}: {
  currentValue: unknown
  nextValue: unknown
  requestedHistory?: 'push' | 'replace'
  parserHistory?: 'push' | 'replace'
}): PanelHistoryAction {
  const isClear = isPanelValueClear(nextValue)

  if (requestedHistory === 'replace') {
    if (isClear) return 'replace-clear'
    return 'replace'
  }

  if (isClear) return 'dismiss'

  const isOpening = isPanelValueClear(currentValue)
  if (isOpening === false) return 'replace'

  const shouldPush = requestedHistory === 'push' || parserHistory === 'push'
  if (shouldPush) return 'push'
  return 'replace'
}

/** Search with one panel param removed, so key order does not matter. */
export function searchWithoutPanelParam(search: string, panelKey: string) {
  const params = new URLSearchParams(search)
  params.delete(panelKey)

  const entries = [...params.entries()].sort((left, right) => left[0].localeCompare(right[0]))
  const normalized = new URLSearchParams()

  for (const [key, value] of entries) {
    normalized.append(key, value)
  }

  return normalized.toString()
}

export function shouldGoBackOnDismiss({
  navigationAvailable,
  ownership,
  currentEntryKey,
  currentPathname,
  currentSearch,
  currentHash,
  panelKey,
}: {
  navigationAvailable: boolean
  ownership: PanelEntryOwnership | null
  currentEntryKey: string | null
  currentPathname: string
  currentSearch: string
  currentHash: string
  panelKey: string
}) {
  if (navigationAvailable === false) return false
  if (ownership === null) return false
  if (currentEntryKey !== ownership.entryKey) return false
  if (currentPathname !== ownership.pathname) return false
  if (currentHash !== ownership.hash) return false

  const searchMatches =
    searchWithoutPanelParam(currentSearch, panelKey) === ownership.searchWithoutPanel

  return searchMatches
}

/** How far `history.go` must travel to put the open entry back. Null skips the guard. */
export function traverseRestoreDelta(openIndex: number | null, destinationIndex: number | null) {
  if (openIndex === null || destinationIndex === null) return null

  const delta = openIndex - destinationIndex
  if (delta === 0) return null

  return delta
}

export function isHashOnlyChange(currentHref: string, destinationUrl: string) {
  let current: URL
  let destination: URL

  try {
    current = new URL(currentHref)
    destination = new URL(destinationUrl, currentHref)
  } catch {
    return false
  }

  const sameDocument =
    current.origin === destination.origin &&
    current.pathname === destination.pathname &&
    current.search === destination.search

  if (sameDocument === false) return false

  return current.hash !== destination.hash
}
