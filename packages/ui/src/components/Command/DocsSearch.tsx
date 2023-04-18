import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import {
  Button,
  IconAlertTriangle,
  IconBook,
  IconChevronRight,
  IconHash,
  IconSearch,
  useCommandMenu,
} from 'ui'
import { CommandGroup, CommandItem, CommandLabel, TextHighlighter } from './Command.utils'

import { debounce } from 'lodash'

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
}

export interface PageSection {
  slug: string
  heading: string
}

export interface PageMetadata {
  title: string
  description: string
}

export interface PageResult {
  type: PageType
  path: string
  meta: PageMetadata
  sections: PageSection[]
}

const DocsSearch = () => {
  const [results, setResults] = useState<PageResult[]>()
  const [hasSearchError, setHasSearchError] = useState(false)
  const supabaseClient = useSupabaseClient()
  const { isLoading, setIsLoading, search, setSearch } = useCommandMenu()

  const handleSearch = useCallback(
    async (query: string) => {
      setHasSearchError(false)
      setIsLoading(true)

      const { error, data: pageResults } = await supabaseClient.functions.invoke<PageResult[]>(
        'search-v2',
        {
          body: { query },
        }
      )

      setIsLoading(false)

      if (error) {
        setIsLoading(false)

        setHasSearchError(true)
        console.error(error)
        return
      }

      if (!Array.isArray(pageResults)) {
        setIsLoading(false)
        setHasSearchError(true)
        console.error('Malformed response')
        return
      }

      setResults(pageResults)
    },
    [supabaseClient]
  )

  function handleResetPrompt() {
    setSearch('')
    setResults(undefined)
    setHasSearchError(false)
  }

  const debouncedSearch = useMemo(() => debounce(handleSearch, 1000), [handleSearch])

  // Search initial query immediately (note - empty useEffect deps)
  useEffect(() => {
    if (search) {
      handleSearch(search)
    }
  }, [])

  // TODO: can we do this w/o useEffect if query comes from context?
  useEffect(() => {
    if (search) {
      debouncedSearch(search)
    }
  }, [search])

  const ChevronArrow = () => (
    <IconChevronRight
      strokeWidth={1.5}
      className="
        text-scale-900
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
        bg-scale-100
        group-aria-selected:scale-[105%]
        group-aria-selected:bg-scale-1200
        text-scale-1200
        group-aria-selected:text-scale-100
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
      {results &&
        results.length > 0 &&
        results.map((page, i) => {
          const pageSections = page.sections.filter((section) => !!section.heading)
          return (
            <CommandGroup
              heading=""
              forceMount
              key={`${page.meta.title}-group-index-${i}`}
              value={`${page.meta.title}-group-index-${i}`}
            >
              <CommandItem
                forceMount
                key={`${page.meta.title}-item-index-${i}`}
                value={`${page.meta.title}-item-index-${i}`}
                type="block-link"
                onSelect={() => {
                  // TODO: replace with Next.js router/Link when cross-project link logic solved
                  window.location.assign(`/docs/${page.path}`)
                }}
              >
                <div className="grow flex gap-3 items-center">
                  <IconContainer>
                    <IconBook strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
                  </IconContainer>
                  <div className="flex flex-col gap-0">
                    <CommandLabel>
                      <TextHighlighter text={page.meta.title} query={search} />
                    </CommandLabel>
                    <div className="text-xs text-scale-900">
                      <TextHighlighter text={page.meta.description} query={search} />
                    </div>
                  </div>
                </div>

                <ChevronArrow />
              </CommandItem>
              {pageSections.length > 0 && (
                <div className="border-l border-scale-500 ml-3 pt-3">
                  {pageSections.map((section, i) => (
                    <CommandItem
                      forceMount
                      className="ml-3 mb-3"
                      onSelect={() => {
                        // TODO: replace with Next.js router/Link when cross-project link logic solved
                        window.location.assign(
                          `/docs/${page.path}${page.type === PageType.Reference ? '/' : '#'}${
                            section.slug
                          }`
                        )
                      }}
                      key={`${page.meta.title}__${section.heading}-item-index-${i}`}
                      value={`${page.meta.title}__${section.heading}-item-index-${i}`}
                      type="block-link"
                    >
                      <div className="grow flex gap-3 items-center">
                        <IconContainer>
                          <IconHash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
                        </IconContainer>
                        <div className="flex flex-col gap-2">
                          <cite>
                            <TextHighlighter
                              className="not-italic text-xs rounded-full px-2 py-1 bg-scale-500 text-scale-1200"
                              text={page.meta.title}
                              query={search}
                            />
                          </cite>
                          <CommandLabel>
                            <TextHighlighter text={section.heading} query={search} />
                          </CommandLabel>
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
      {!results && !hasSearchError && !isLoading && (
        <CommandGroup forceMount>
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
                forceMount
                key={key}
              >
                <IconSearch />
                {question}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}
      {isLoading && !results && (
        <div className="p-6 grid gap-6 my-4">
          <p className="text-lg text-scale-900 text-center">Searching for results</p>
        </div>
      )}
      {results && results.length === 0 && (
        <div className="p-6 flex flex-col items-center gap-6 mt-4 text-scale-1100">
          <IconAlertTriangle strokeWidth={1.5} size={40} />
          <p className="text-lg text-center">No results found.</p>
          <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}
      {hasSearchError && (
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
