import * as React from 'react'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { compact, debounce, uniqBy } from 'lodash'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import {
  Button,
  IconAlertTriangle,
  IconBook,
  IconChevronRight,
  IconGitHub,
  IconHash,
  IconMessageSquare,
  IconSearch,
  useCommandMenu,
} from 'ui'
import {
  CommandGroup,
  CommandItem,
  CommandLabel,
  TextHighlighter,
  escapeDoubleQuotes,
} from './Command.utils'
import { useRouter } from 'next/router'

const NUMBER_SOURCES = 2

const FUNCTIONS_URL = '/functions/v1/'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

export enum PageType {
  Markdown = 'markdown',
  Reference = 'reference',
  Integration = 'partner-integration',
  GithubDiscussion = 'github-discussions',
}

interface PageSection {
  heading: string
  slug: string
}

export interface Page {
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

const DocsSearch = () => {
  const [state, dispatch] = useReducer(reducer, { status: 'initial', key: 0 })
  const supabaseClient = useSupabaseClient()
  const { search, setSearch, inputRef, site, setIsOpen } = useCommandMenu()
  const key = useRef(0)
  const initialLoad = useRef(true)
  const router = useRouter()

  async function openLink(pageType: PageType, link: string) {
    switch (pageType) {
      case PageType.Markdown:
      case PageType.Reference:
        if (site === 'docs') {
          await router.push(link)
          return setIsOpen(false)
        } else if (site === 'website') {
          await router.push(`/docs${link}`)
          setIsOpen(false)
        } else {
          window.open(`https://supabase.com/docs${link}`, '_blank')
          setIsOpen(false)
        }
        break
      case PageType.Integration:
        if (site === 'website') {
          router.push(link)
          setIsOpen(false)
        } else {
          window.open(`https://supabase.com${link}`, '_blank')
          setIsOpen(false)
        }
        break
      case PageType.GithubDiscussion:
        window.open(link, '_blank')
        setIsOpen(false)
        break
      default:
        throw new Error(`Unknown page type '${pageType}'`)
    }
  }

  const hasResults =
    state.status === 'fullResults' ||
    state.status === 'partialResults' ||
    (state.status === 'loading' && state.staleResults.length > 0)

  const handleSearch = useCallback(
    async (query: string) => {
      key.current += 1
      const localKey = key.current
      dispatch({ type: 'newSearchDispatched', key: localKey })

      let sourcesLoaded = 0

      supabaseClient.rpc('docs_search_fts', { query: query.trim() }).then(({ data, error }) => {
        sourcesLoaded += 1
        if (error || !Array.isArray(data)) {
          dispatch({
            type: 'errored',
            key: localKey,
            sourcesLoaded,
            message: error?.message ?? '',
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

      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}${FUNCTIONS_URL}search-embeddings`, {
        method: 'POST',
        body: JSON.stringify({ query }),
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
    },
    [supabaseClient]
  )

  function handleResetPrompt() {
    setSearch('')

    key.current += 1
    dispatch({
      type: 'reset',
      key: key.current,
    })
  }

  const debouncedSearch = useMemo(() => debounce(handleSearch, 150), [handleSearch])

  useEffect(() => {
    if (initialLoad.current) {
      // On first navigation into 'docs search' page, search immediately
      if (search) {
        handleSearch(search)
      }
      initialLoad.current = false
    } else if (search) {
      // Else if user is typing, debounce search
      debouncedSearch(search)
    } else {
      // If user clears search, reset results
      debouncedSearch.cancel()
      key.current += 1
      dispatch({ type: 'reset', key: key.current })
    }
  }, [search, handleSearch, debouncedSearch])

  // Immediately run search if user presses enter
  // and abort any debounced searches that are waiting
  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (
        event.key === 'Enter' &&
        document.activeElement === inputRef.current &&
        search &&
        // If there are results, cmdk menu will trigger navigation to the highlighted
        // result on Enter, even though the active element is the input
        !hasResults
      ) {
        event.preventDefault()
        debouncedSearch.cancel()
        handleSearch(search)
      }
    }

    inputRef.current?.addEventListener('keydown', handleEnter)

    return () => inputRef.current?.removeEventListener('keydown', handleEnter)
  }, [search, hasResults])

  const ChevronArrow = () => (
    <IconChevronRight
      strokeWidth={1.5}
      className="
        text-foreground-muted
        opacity-0
        -left-4
        group-aria-selected:scale-[101%]
        group-aria-selected:opacity-100
        group-aria-selected:left-0
      "
    />
  )

  const IconContainer = (
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
  ) => (
    <div
      className="
        transition
        w-6 h-6
        bg-alternative
        group-aria-selected:scale-[105%]
        group-aria-selected:bg-foreground
        text-foreground
        group-aria-selected:text-background
        rounded flex
        items-center
        justify-center

        group-aria-selected:[&_svg]:scale-[103%]
        "
      {...props}
    />
  )

  return (
    <>
      {hasResults &&
        ('results' in state ? state.results : state.staleResults).map((page, i) => {
          return (
            <CommandGroup
              heading=""
              key={`${page.path}-group`}
              value={`${escapeDoubleQuotes(page.title)}-group-index-${i}`}
              forceMount={true}
            >
              <CommandItem
                key={`${page.path}-item`}
                value={`${escapeDoubleQuotes(page.title)}-item-index-${i}`}
                type="block-link"
                onSelect={() => {
                  openLink(page.type, formatPageUrl(page))
                }}
                forceMount={true}
              >
                <div className="grow flex gap-3 items-center">
                  <IconContainer>{getPageIcon(page)}</IconContainer>
                  <div className="flex flex-col gap-0">
                    <CommandLabel>
                      <TextHighlighter text={page.title} query={search} />
                    </CommandLabel>
                    {(page.description || page.subtitle) && (
                      <div className="text-xs text-foreground-muted">
                        <TextHighlighter
                          text={page.description! || page.subtitle!}
                          query={search}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <ChevronArrow />
              </CommandItem>
              {page.sections.length > 0 && (
                <div className="border-l border-default ml-3 pt-3">
                  {page.sections.map((section, i) => (
                    <CommandItem
                      className="ml-3 mb-3"
                      onSelect={() => {
                        openLink(page.type, formatSectionUrl(page, section))
                      }}
                      key={`${page.path}__${section.heading}-item`}
                      value={`${escapeDoubleQuotes(
                        page.title
                      )}__${escapeDoubleQuotes(section.heading)}-item-index-${i}`}
                      forceMount={true}
                      type="block-link"
                    >
                      <div className="grow flex gap-3 items-center">
                        <IconContainer>{getPageSectionIcon(page)}</IconContainer>
                        <div className="flex flex-col gap-2">
                          <cite>
                            <TextHighlighter
                              className="not-italic text-xs rounded-full px-2 py-1 bg-overlay-hover text-foreground"
                              text={page.title}
                              query={search}
                            />
                          </cite>
                          {section.heading && (
                            <CommandLabel>
                              <TextHighlighter text={section.heading} query={search} />
                            </CommandLabel>
                          )}
                        </div>
                      </div>
                      <ChevronArrow />
                    </CommandItem>
                  ))}
                </div>
              )}
            </CommandGroup>
          )
        })}
      {state.status === 'initial' && (
        <CommandGroup>
          {questions.map((question) => {
            const key = question.replace(/\s+/g, '_')
            return (
              <CommandItem
                disabled={hasResults}
                onSelect={() => {
                  if (!search) {
                    handleSearch(question)
                    setSearch(question)
                  }
                }}
                type="command"
                key={key}
              >
                <IconSearch />
                {question}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}
      {state.status === 'loading' && state.staleResults.length === 0 && (
        <div className="p-6 grid gap-6 my-4">
          <p className="text-lg text-foreground-muted text-center">Searching for results</p>
        </div>
      )}
      {state.status === 'noResults' && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4 text-foreground-light">
          <IconAlertTriangle strokeWidth={1.5} size={40} />
          <p className="text-lg text-center">No results found.</p>
          <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}
      {state.status === 'error' && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4">
          <IconAlertTriangle strokeWidth={1.5} size={40} />
          <p className="text-lg text-center">
            Sorry, looks like we&apos;re having some issues with search!
          </p>
          <p className="text-sm text-center">Please try again in a bit.</p>
          <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}
    </>
  )
}

export default DocsSearch

export function formatPageUrl(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
    case PageType.GithubDiscussion:
      return page.path
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function formatSectionUrl(page: Page, section: PageSection) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.GithubDiscussion:
      return `${formatPageUrl(page)}#${section.slug ?? ''}`
    case PageType.Reference:
      return `${formatPageUrl(page)}/${section.slug ?? ''}`
    case PageType.Integration:
      // [Charis] Markdown headings on integrations pages don't have slugs yet
      return formatPageUrl(page)
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <IconBook strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <IconGitHub strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <IconHash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <IconMessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}
