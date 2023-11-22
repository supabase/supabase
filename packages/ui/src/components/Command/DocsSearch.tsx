import * as React from 'react'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { compact, uniqBy } from 'lodash'

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
import { CommandGroup, CommandItem, CommandLabel, TextHighlighter } from './Command.utils'

import { debounce } from 'lodash'

const NUMBER_SOURCES = 2

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

function removeDoubleQuotes(inputString: string): string {
  // Use the replace method with a regular expression to remove double quotes
  return inputString.replace(/"/g, '')
}

const getDocsUrl = () => {
  if (!process.env.NEXT_PUBLIC_SITE_URL || !process.env.NEXT_PUBLIC_LOCAL_SUPABASE) {
    return 'https://supabase.com/docs'
  }

  const isLocal =
    process.env.NEXT_PUBLIC_SITE_URL.includes('localhost') || process.env.NEXT_PUBLIC_LOCAL_SUPABASE
  return isLocal ? 'http://localhost:3001/docs' : 'https://supabase.com/docs'
}

type SearchState =
  | {
      status: 'initial'
    }
  | {
      status: 'loading'
      staleResults: Page[]
      searchId: number
    }
  | {
      status: 'partialResults'
      results: Page[]
      searchId: number
    }
  | {
      status: 'fullResults'
      results: Page[]
    }
  | {
      status: 'noResults'
    }
  | {
      status: 'error'
      message: string
    }

type Action =
  | {
      type: 'resultsReturned'
      sourcesLoaded: number
      searchId: number
      results: unknown[]
    }
  | {
      type: 'newSearchDispatched'
      searchId: number
    }
  | {
      type: 'reset'
    }
  | {
      type: 'errored'
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
  switch (action.type) {
    case 'resultsReturned':
      if ('searchId' in state && state.searchId > action.searchId) {
        return state
      }
      const allSourcesLoaded = action.sourcesLoaded === NUMBER_SOURCES
      const newResults = uniqBy(compact(action.results.map(reshapeResults)), (res) => res.id)
      const allResults =
        state.status === 'partialResults' && state.searchId === action.searchId
          ? state.results.concat(newResults)
          : newResults
      if (!allResults.length) {
        return allSourcesLoaded
          ? {
              status: 'noResults',
            }
          : {
              status: 'loading',
              searchId: action.searchId,
              staleResults: [],
            }
      }
      return allSourcesLoaded
        ? {
            status: 'fullResults',
            results: allResults,
          }
        : {
            status: 'partialResults',
            searchId: action.searchId,
            results: allResults,
          }
    case 'newSearchDispatched':
      return {
        status: 'loading',
        searchId: Math.max('searchId' in state ? state.searchId : 0, action.searchId),
        staleResults: 'results' in state ? state.results : [],
      }
    case 'reset':
      return {
        status: 'initial',
      }
    case 'errored':
      return {
        status: 'error',
        message: action.message,
      }
    default:
      return state
  }
}

const DocsSearch = () => {
  const [state, dispatch] = useReducer(reducer, { status: 'initial' })
  const supabaseClient = useSupabaseClient()
  const { isLoading, setIsLoading, search, setSearch } = useCommandMenu()
  const searchId = useRef(0)
  const initialLoad = useRef(true)

  const handleSearch = useCallback(
    async (query: string) => {
      setIsLoading(true)

      searchId.current += 1
      const localSearchId = searchId.current
      dispatch({ type: 'newSearchDispatched', searchId: localSearchId })

      let loadedSources = 0

      supabaseClient.functions
        .invoke('search-fts', {
          body: { query },
        })
        .then(({ data: results, error }) => {
          loadedSources += 1
          if (error) {
            dispatch({
              type: 'errored',
              message: error.message ?? '',
            })
          } else {
            dispatch({
              type: 'resultsReturned',
              sourcesLoaded: loadedSources,
              searchId: localSearchId,
              results,
            })
          }
          if (loadedSources === NUMBER_SOURCES) {
            setIsLoading(false)
          }
        })

      supabaseClient.functions
        .invoke('search-v2', {
          body: { query },
        })
        .then(({ data: results, error }) => {
          loadedSources += 1
          if (error) {
            dispatch({
              type: 'errored',
              message: error.message ?? '',
            })
          } else {
            dispatch({
              type: 'resultsReturned',
              sourcesLoaded: loadedSources,
              searchId: localSearchId,
              results,
            })
          }
          if (loadedSources === NUMBER_SOURCES) {
            setIsLoading(false)
          }
        })
    },
    [supabaseClient]
  )

  function handleResetPrompt() {
    setSearch('')
    dispatch({
      type: 'reset',
    })
  }

  const debouncedSearch = useMemo(() => debounce(handleSearch, 1000), [handleSearch])

  useEffect(() => {
    if (!search) {
      // Clear search results if user deletes query
      dispatch({ type: 'reset' })
    } else if (initialLoad.current) {
      handleSearch(search)
      initialLoad.current = false
    } else {
      debouncedSearch(search)
    }
  }, [search])

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

  const hasResults =
    state.status === 'fullResults' ||
    state.status === 'partialResults' ||
    (state.status === 'loading' && state.staleResults.length > 0)

  return (
    <>
      {hasResults &&
        ('results' in state ? state.results : state.staleResults).map((page, i) => {
          return (
            <CommandGroup
              heading=""
              key={`${page.title}-group-index-${i}`}
              // Adding the search term here is a hack to prevent the cmdk menu
              // filter from filtering out search results
              value={`${search}-${page.title}-group-index-${i}`}
            >
              <CommandItem
                key={`${page.title}-item-index-${i}`}
                value={`${search}-${removeDoubleQuotes(page.title)}-item-index-${i}`}
                type="block-link"
                onSelect={() => {
                  openLink(page.type, formatPageUrl(page))
                }}
              >
                <div className="grow flex gap-3 items-center">
                  <IconContainer>{getPageIcon(page)}</IconContainer>
                  <div className="flex flex-col gap-0">
                    <CommandLabel>
                      <TextHighlighter text={page.title} query={search} />
                    </CommandLabel>
                    {page.description && (
                      <div className="text-xs text-foreground-muted">
                        <TextHighlighter text={page.description} query={search} />
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
                      key={`${page.title}__${section.heading}-item-index-${i}`}
                      value={`${search}-${removeDoubleQuotes(page.title)}__${removeDoubleQuotes(
                        section.heading ?? ''
                      )}-item-index-${i}`}
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
                disabled={isLoading}
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
  const docsUrl = getDocsUrl()
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
      return `${docsUrl}${page.path}`
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
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
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
      return <IconHash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <IconMessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function openLink(pageType: PageType, link: string) {
  switch (pageType) {
    case PageType.Markdown:
    case PageType.Reference:
      return window.location.assign(link)
    case PageType.GithubDiscussion:
      return window.open(link, '_blank')
    default:
      throw new Error(`Unknown page type '${pageType}'`)
  }
}
