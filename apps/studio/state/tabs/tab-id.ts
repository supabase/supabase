import { isTabKind, kindsOnSurface, TAB_KINDS, type TabKind, type TabSurface } from './kinds'

export interface ParsedTabId {
  kind: TabKind
  contentId: string
}

/** A tab's id is always `${kind}-${contentId}` — kind names never contain a dash. Returns null for an empty contentId, since `parseTabId` can't invert it. */
export function createTabId(kind: TabKind, contentId: string): string | null {
  if (!contentId) return null
  return `${kind}-${contentId}`
}

/** Inverse of `createTabId`. Returns null for a malformed id or an unknown kind. */
export function parseTabId(tabId: string): ParsedTabId | null {
  const dashIndex = tabId.indexOf('-')
  if (dashIndex === -1) return null

  const kind = tabId.slice(0, dashIndex)
  const contentId = tabId.slice(dashIndex + 1)
  if (!contentId || !isTabKind(kind)) return null

  return { kind, contentId }
}

/** The URL segment a tab id renders as. Drops the prefix for a bare kind (`sql-<uuid>` → `<uuid>`, and every table kind); keeps it otherwise (`notebook-<uuid>` → `notebook-<uuid>`). Passes through a null `tabId`, so it composes directly with `createTabId`. */
export function toUrlSegment(tabId: string | null): string | null {
  if (tabId === null) return null

  const parsed = parseTabId(tabId)
  if (!parsed) return null

  const { urlPrefix } = TAB_KINDS[parsed.kind]
  return urlPrefix === null ? parsed.contentId : `${urlPrefix}-${parsed.contentId}`
}

/** Inverse of `toUrlSegment`, scoped to a surface. A bare segment resolves only when exactly one bare kind exists on the surface (`sql`); the table surface's five bare kinds have no URL disambiguator, matching `/editor/[id]`, which learns kind from the fetched entity rather than the URL. */
export function parseUrlSegment(segment: string, surface: TabSurface): ParsedTabId | null {
  if (!segment) return null

  let bareKind: TabKind | null = null
  let bareKindIsAmbiguous = false

  for (const kind of kindsOnSurface(surface)) {
    const { urlPrefix } = TAB_KINDS[kind]
    if (urlPrefix === null) {
      if (bareKind === null) bareKind = kind
      else bareKindIsAmbiguous = true
      continue
    }

    const prefix = `${urlPrefix}-`
    if (segment.startsWith(prefix)) {
      const contentId = segment.slice(prefix.length)
      if (contentId) return { kind, contentId }
    }
  }

  return bareKind && !bareKindIsAmbiguous ? { kind: bareKind, contentId: segment } : null
}
