'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import {
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
  DocsSearchResultType as PageType,
  useDocsSearch,
} from 'common'
import { Book, ChevronRight, Github, Hash, Loader2, MessageSquare, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Button, StatusIcon } from 'ui'
import { CommandGroup, CommandItem, CommandLabel, TextHighlighter } from './Command.utils'
import { useCommandMenu } from './CommandMenuContext'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const DocsSearch = () => {
  const supabaseClient = useSupabaseClient()
  const {
    searchState: state,
    handleDocsSearch: handleSearch,
    handleDocsSearchDebounced: debouncedSearch,
    resetSearch,
  } = useDocsSearch(supabaseClient)
  const { search, setSearch, inputRef, site, setIsOpen } = useCommandMenu()
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

  function handleResetPrompt() {
    setSearch('')
    resetSearch()
  }

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
      resetSearch()
    }
  }, [search, handleSearch, debouncedSearch, resetSearch])

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
    <ChevronRight
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
        bg-surface-100
        border
        group-aria-selected:bg-surface-200
        group-aria-selected:text-foreground-lighter
        text-foreground-muted
        rounded flex
        items-center
        justify-center
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
              value={`${encodeURIComponent(page.title)}-group-index-${i}`}
              forceMount={true}
            >
              <CommandItem
                key={`${page.path}-item`}
                value={`${encodeURIComponent(page.title)}-item-index-${i}`}
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
                <div className="border-l border-muted ml-3 pt-3">
                  {page.sections.map((section, i) => (
                    <CommandItem
                      className="ml-3 mb-3"
                      onSelect={() => {
                        openLink(page.type, formatSectionUrl(page, section))
                      }}
                      key={`${page.path}__${section.heading}-item`}
                      value={`${encodeURIComponent(
                        page.title
                      )}__${encodeURIComponent(section.heading)}-item-index-${i}`}
                      forceMount={true}
                      type="block-link"
                    >
                      <div className="grow flex gap-3 items-center">
                        <IconContainer>{getPageSectionIcon(page)}</IconContainer>
                        <div className="flex flex-col gap-0">
                          <cite>
                            <TextHighlighter
                              className="not-italic text-[10px] rounded-full px-2 py-1 bg-surface-300 text-foreground-muted"
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
                <Search />
                {question}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}
      {state.status === 'loading' && state.staleResults.length === 0 && (
        <div className="flex items-center gap-3 my-4 justify-center">
          <Loader2 className="animate animate-spin text-foreground-muted" size={14} />
          <p className="text-sm text-foreground-muted text-center">Searching for results</p>
        </div>
      )}
      {state.status === 'noResults' && (
        <div className="p-6 flex flex-col items-center gap-3 mt-4 text-foreground-light">
          <StatusIcon variant="default" />
          <p className="text-sm text-foreground-light text-center">No results found.</p>
          <Button size="tiny" type="default" onClick={handleResetPrompt}>
            Try again?
          </Button>
        </div>
      )}
      {state.status === 'error' && (
        <div className="p-6 flex flex-col items-center gap-3 mt-4">
          <StatusIcon variant="warning" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-foreground-light">
              Sorry, looks like we&apos;re having some issues with search.
            </p>
            <p className="text-sm text-foreground-lighter">Please try again in a bit.</p>
          </div>
          <Button size="tiny" type="default" onClick={handleResetPrompt}>
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
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Hash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <MessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}
