'use client'

import { compact, debounce, uniqBy } from 'lodash'
import { useCallback, useMemo, useReducer, useRef } from 'react'

import { isFeatureEnabled } from '../enabled-features'

const NUMBER_SOURCES = 2

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const FUNCTIONS_URL = '/functions/v1/'

enum PageType {
  Markdown = 'markdown',
  Reference = 'reference',
  Integration = 'partner-integration',
  GithubDiscussion = 'github-discussions',
  Troubleshooting = 'troubleshooting',
}

interface PageSection {
  heading: string
  slug: string
}

interface Page {
  id: number
  path: string
  type: PageType
  title: string
  subtitle: string | null
  description: string | null
  sections: PageSection[]
}

type SearchState =
  | {
      status: 'initial'
      key: number
    }
  | {
      status: 'loading'
      key: number
      staleResults: Page[]
    }
  | {
      status: 'partialResults'
      key: number
      results: Page[]
    }
  | {
      status: 'fullResults'
      key: number
      results: Page[]
    }
  | {
      status: 'noResults'
      key: number
    }
  | {
      status: 'error'
      key: number
      message: string
    }

type Action =
  | {
      type: 'resultsReturned'
      key: number
      sourcesLoaded: number
      results: unknown[]
    }
  | {
      type: 'newSearchDispatched'
      key: number
    }
  | {
      type: 'reset'
      key: number
    }
  | {
      type: 'errored'
      key: number
      sourcesLoaded: number
      message: string
    }

function reshapeResults(result: unknown): Page | null {
  if (typeof result !== 'object' || result === null) {
    return null
  }
  if (!('id' in result && 'path' in result && 'type' in result && 'title' in result)) {
    return null
  }

  const sections: PageSection[] = []
  if (
    'headings' in result &&
    Array.isArray(result.headings) &&
    'slugs' in result &&
    Array.isArray(result.slugs) &&
    result.headings.length === result.slugs.length
  ) {
    result.headings.forEach((heading, idx) => {
      const slug = (result.slugs as Array<string>)[idx]
      if (heading && slug) {
        sections.push({ heading, slug })
      }
    })
  }

  return {
    id: result.id as number,
    path: result.path as string,
    type: result.type as PageType,
    title: result.title as string,
    subtitle: 'subtitle' in result ? (result.subtitle as string) : null,
    description: 'description' in result ? (result.description as string) : null,
    sections,
  }
}

function reducer(state: SearchState, action: Action): SearchState {
  // Ignore responses from outdated async functions
  if (state.key > action.key) {
    return state
  }
  switch (action.type) {
    case 'resultsReturned':
      const allSourcesLoaded = action.sourcesLoaded === NUMBER_SOURCES
      const newResults = compact(action.results.map(reshapeResults))
      // If the new responses are from the same request as the current responses,
      // combine the responses.
      // If the new responses are from a fresher request, replace the current responses.
      const allResults =
        state.status === 'partialResults' && state.key === action.key
          ? uniqBy(state.results.concat(newResults), (res) => res.id)
          : newResults
      if (!allResults.length) {
        return allSourcesLoaded
          ? {
              status: 'noResults',
              key: action.key,
            }
          : {
              status: 'loading',
              key: action.key,
              staleResults:
                'results' in state
                  ? state.results
                  : 'staleResults' in state
                    ? state.staleResults
                    : [],
            }
      }
      return allSourcesLoaded
        ? {
            status: 'fullResults',
            key: action.key,
            results: allResults,
          }
        : {
            status: 'partialResults',
            key: action.key,
            results: allResults,
          }
    case 'newSearchDispatched':
      return {
        status: 'loading',
        key: action.key,
        staleResults:
          'results' in state ? state.results : 'staleResults' in state ? state.staleResults : [],
      }
    case 'reset':
      return {
        status: 'initial',
        key: action.key,
      }
    case 'errored':
      // At least one search has failed and all non-failing searches have come back empty
      if (action.sourcesLoaded === NUMBER_SOURCES && !('results' in state)) {
        return {
          status: 'error',
          key: action.key,
          message: action.message,
        }
      }
      return state
    default:
      return state
  }
}

const useDocsSearch = () => {
  const [state, dispatch] = useReducer(reducer, { status: 'initial', key: 0 })
  const key = useRef(0)

  const handleSearch = useCallback(async (query: string) => {
    key.current += 1
    const localKey = key.current
    dispatch({ type: 'newSearchDispatched', key: localKey })

    let sourcesLoaded = 0

    const useAlternateSearchIndex = !isFeatureEnabled('search:fullIndex')

    const searchEndpoint = useAlternateSearchIndex ? 'docs_search_fts_nimbus' : 'docs_search_fts'
    fetch(`${SUPABASE_URL}/rest/v1/rpc/${searchEndpoint}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(SUPABASE_ANON_KEY && {
          apikey: SUPABASE_ANON_KEY,
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        }),
      },
      body: JSON.stringify({ query: query.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        sourcesLoaded += 1
        if (!Array.isArray(data)) {
          dispatch({
            type: 'errored',
            key: localKey,
            sourcesLoaded,
            message: data?.message ?? '',
          })
        } else {
          dispatch({
            type: 'resultsReturned',
            key: localKey,
            sourcesLoaded,
            results: data,
          })
        }
      })
      .catch((error: unknown) => {
        sourcesLoaded += 1
        console.error(`[ERROR] Error fetching Full Text Search results: ${error}`)

        dispatch({
          type: 'errored',
          key: localKey,
          sourcesLoaded,
          message: '',
        })
      })

    fetch(`${SUPABASE_URL}${FUNCTIONS_URL}search-embeddings`, {
      method: 'POST',
      body: JSON.stringify({ query, useAlternateSearchIndex }),
    })
      .then((response) => response.json())
      .then((results) => {
        if (!Array.isArray(results)) {
          throw Error("didn't get expected results array")
        }
        sourcesLoaded += 1
        dispatch({
          type: 'resultsReturned',
          key: localKey,
          sourcesLoaded,
          results,
        })
      })
      .catch((error) => {
        sourcesLoaded += 1
        dispatch({
          type: 'errored',
          key: localKey,
          sourcesLoaded,
          message: error.message ?? '',
        })
      })
  }, [])

  const debouncedSearch = useMemo(() => debounce(handleSearch, 150), [handleSearch])

  const resetSearch = useCallback(() => {
    key.current += 1
    dispatch({
      type: 'reset',
      key: key.current,
    })
  }, [])

  return {
    searchState: state,
    handleDocsSearch: handleSearch,
    handleDocsSearchDebounced: debouncedSearch,
    resetSearch,
  }
}

export { useDocsSearch, PageType as DocsSearchResultType }
export type { Page as DocsSearchResult, PageSection as DocsSearchResultSection }
