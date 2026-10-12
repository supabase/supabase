import type { useDocsSearchV2 } from 'common'
import type { ReactNode } from 'react'

type DocsSearchV2State = ReturnType<typeof useDocsSearchV2>['searchState']

interface GetIsSearchingParams {
  searchState: DocsSearchV2State
  query: string
}

/** Common English prepositions/articles/conjunctions, excluded from highlighting so a query like "the mcp server" doesn't bold "the". */
const IGNORED_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'from',
  'by',
  'with',
  'as',
])

/** Join a heading breadcrumb into a single display string, e.g. ['Title 1', 'Title 2'] -> 'Title 1 > Title 2'. */
function formatHeadingPath(headingPath: string[]): string {
  return headingPath.join(' > ')
}

/** Case-insensitive, whitespace-split match ranges for every occurrence of every query token in text. */
function getMatchRanges(text: string, query: string): Array<[number, number]> {
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !IGNORED_WORDS.has(token.toLowerCase()))
  if (tokens.length === 0) return []

  const lowerText = text.toLowerCase()
  const ranges: Array<[number, number]> = []

  for (const token of tokens) {
    const lowerToken = token.toLowerCase()
    let fromIndex = 0
    while (fromIndex <= lowerText.length) {
      const idx = lowerText.indexOf(lowerToken, fromIndex)
      if (idx === -1) break
      ranges.push([idx, idx + lowerToken.length])
      fromIndex = idx + lowerToken.length
    }
  }

  if (ranges.length === 0) return []

  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = [ranges[0]]
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1]
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end)
    } else {
      merged.push([start, end])
    }
  }
  return merged
}

/**
 * Highlight every case-insensitive, per-word partial match of `query` inside `text`.
 * Returns the plain string when there's no match, otherwise a fragment with matches
 * wrapped in <mark>, preserving the original casing of `text`.
 */
function highlightMatches(text: string, query: string): ReactNode {
  const ranges = getMatchRanges(text, query)
  if (ranges.length === 0) return text

  const nodes: ReactNode[] = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(text.slice(cursor, start))
    nodes.push(
      <mark key={i} className="-mx-px rounded-sm bg-primary-bright/15 px-px text-primary">
        {text.slice(start, end)}
      </mark>
    )
    cursor = end
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))

  return <>{nodes}</>
}

// drives the loading beam: on while a request is in flight or about to be sent
function getIsSearching({ searchState, query }: GetIsSearchingParams): boolean {
  if (searchState.status === 'loading') return true
  if (searchState.status === 'error') return false

  const trimmedQuery = query.trim()
  const settledQuery = 'query' in searchState ? searchState.query : null

  // so a search is on its way and the beam starts on the keystroke, not when the request fires
  return trimmedQuery !== '' && trimmedQuery !== settledQuery
}

export { formatHeadingPath, getIsSearching, highlightMatches }
