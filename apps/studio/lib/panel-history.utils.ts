export type PanelEntryOwnership = {
  entryKey: string
  pathname: string
  searchWithoutPanel: string
  hash: string
}

export type PanelHistoryAction = 'push' | 'replace' | 'replace-clear' | 'dismiss' | 'noop'

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

  // clearing a key that is already clear must not queue another replace
  if (isClear && isPanelValueClear(currentValue)) return 'noop'

  if (requestedHistory === 'replace') {
    if (isClear) return 'replace-clear'
    return 'replace'
  }

  if (isClear) return 'dismiss'

  const isOpening = isPanelValueClear(currentValue)
  if (!isOpening) return 'replace'

  const shouldPush = requestedHistory === 'push' || parserHistory === 'push'
  if (shouldPush) return 'push'
  return 'replace'
}

/** Search with one panel param removed, so key order does not matter. */
export function searchWithoutPanelParam(search: string, panelKey: string) {
  const params = new URLSearchParams(search)
  params.delete(panelKey)

  const entries = [...params.entries()].sort(([left], [right]) => left.localeCompare(right))

  return new URLSearchParams(entries).toString()
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
  if (!navigationAvailable) return false
  if (!ownership) return false
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

  if (!sameDocument) return false

  return current.hash !== destination.hash
}

/** Compare a history href with a router url that may be relative. */
export function sameHistoryUrl(left: string, right: string, base: string) {
  try {
    const a = new URL(left, base)
    const b = new URL(right, base)

    return (
      a.origin === b.origin &&
      a.pathname === b.pathname &&
      a.search === b.search &&
      a.hash === b.hash
    )
  } catch {
    return false
  }
}

/**
 * A delete mutation stays successful for the life of the hook, so Forward
 * restoring that same id must clear it again.
 */
export function isStaleDeletedPanelId(
  currentId: unknown,
  isSuccessDelete: boolean,
  deletedId: unknown
) {
  if (!isSuccessDelete) return false
  if (isPanelValueClear(currentId)) return false
  if (deletedId == null) return false

  return String(currentId) === String(deletedId)
}

export type MissingPanelIdAction = 'keep' | 'clear-silently' | 'clear-and-notify'

/** How to clear a delete-panel id that is not in the loaded list. */
export function missingPanelIdAction({
  listLoaded,
  currentId,
  resourceFound,
  isSuccessDelete,
  deletedId,
}: {
  listLoaded: boolean
  currentId: unknown
  resourceFound: boolean
  isSuccessDelete: boolean
  deletedId: unknown
}): MissingPanelIdAction {
  if (!listLoaded || resourceFound || isPanelValueClear(currentId)) return 'keep'
  // The successful delete stays true, so Forward of that same id must not toast.
  // A different missing id is still the normal not-found case.
  if (isStaleDeletedPanelId(currentId, isSuccessDelete, deletedId)) return 'clear-silently'
  return 'clear-and-notify'
}
