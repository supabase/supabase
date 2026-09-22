'use client'

import { compact, debounce } from 'lodash'
import { useCallback, useMemo, useReducer, useRef } from 'react'

// This app's own base path, set only for apps deployed under a path prefix (docs' is '/docs').
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
// Public URL of the docs deployment, which hosts the search API routes.
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://supabase.com/docs'
// From inside the docs app itself, call our own routes relatively; from studio/www, call docs directly.
const SEARCH_API_BASE = BASE_PATH === '/docs' ? BASE_PATH : DOCS_URL

interface DocsSearchV2Result {
  id: string
  path: string
  title: string
  heading: string
  excerpt: string
}

type SearchState =
  | { status: 'initial'; key: number }
  | { status: 'loading'; key: number; staleResults: DocsSearchV2Result[] }
  | { status: 'results'; key: number; results: DocsSearchV2Result[] }
  | { status: 'noResults'; key: number }
  | { status: 'error'; key: number; message: string }

type Action =
  | { type: 'resultsReturned'; key: number; results: DocsSearchV2Result[] }
  | { type: 'newSearchDispatched'; key: number }
  | { type: 'reset'; key: number }
  | { type: 'errored'; key: number; message: string }

function reshapeResult(row: unknown): DocsSearchV2Result | null {
  if (typeof row !== 'object' || row === null) return null
  if (!('slug' in row && 'page_title' in row && 'heading' in row && 'excerpt' in row)) return null

  const slug = row.slug as string
  return {
    id: `${slug}#${row.heading as string}`,
    path: slug ? `/docs/${slug}` : '/docs',
    title: row.page_title as string,
    heading: row.heading as string,
    excerpt: row.excerpt as string,
  }
}

function reducer(state: SearchState, action: Action): SearchState {
  // Ignore responses from outdated async functions
  if (state.key > action.key) {
    return state
  }
  switch (action.type) {
    case 'resultsReturned':
      return action.results.length
        ? { status: 'results', key: action.key, results: action.results }
        : { status: 'noResults', key: action.key }
    case 'newSearchDispatched':
      return {
        status: 'loading',
        key: action.key,
        staleResults:
          'results' in state ? state.results : 'staleResults' in state ? state.staleResults : [],
      }
    case 'reset':
      return { status: 'initial', key: action.key }
    case 'errored':
      return { status: 'error', key: action.key, message: action.message }
    default:
      return state
  }
}

const useDocsSearchV2 = () => {
  const [state, dispatch] = useReducer(reducer, { status: 'initial', key: 0 })
  const key = useRef(0)

  const handleSearch = useCallback(async (query: string) => {
    key.current += 1
    const localKey = key.current
    dispatch({ type: 'newSearchDispatched', key: localKey })

    try {
      const params = new URLSearchParams({ q: query.trim() })
      const response = await fetch(`${SEARCH_API_BASE}/api/search_v2?${params}`)
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error(data?.error ?? "didn't get expected results array")
      }
      dispatch({
        type: 'resultsReturned',
        key: localKey,
        results: compact(data.map(reshapeResult)),
      })
    } catch (error) {
      console.error(`[ERROR] Error fetching docs search v2 results: ${error}`)
      dispatch({
        type: 'errored',
        key: localKey,
        message: error instanceof Error ? error.message : '',
      })
    }
  }, [])

  const debouncedSearch = useMemo(() => debounce(handleSearch, 250), [handleSearch])

  const resetSearch = useCallback(() => {
    key.current += 1
    dispatch({ type: 'reset', key: key.current })
  }, [])

  return {
    searchState: state,
    handleDocsSearch: handleSearch,
    handleDocsSearchDebounced: debouncedSearch,
    resetSearch,
  }
}

export { useDocsSearchV2 }
export type { DocsSearchV2Result }
