'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Book, ChevronRight, Github, Hash, Loader2, MessageSquare, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'

import { Button, CommandGroup_Shadcn_, CommandItem_Shadcn_, CommandList_Shadcn_, cn } from 'ui'
import { StatusIcon } from 'ui/src/components/StatusIcon'

import {
  Breadcrumb,
  CommandHeader,
  CommandInput,
  CommandWrapper,
  TextHighlighter,
  escapeAttributeSelector,
  generateCommandClassNames,
  useCrossCompatRouter,
  useQuery,
  useSetCommandMenuOpen,
  useSetQuery,
} from '../..'
import { BASE_PATH } from '../shared/constants'
import { SearchResult, SearchResultSubsection, SearchResultType } from './DocsSearchLocal.client'
import { useDocsSearchLocal } from './useDocsSearchLocal'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const ChevronArrow = () => (
  <ChevronRight
    strokeWidth={1.5}
    className={cn(
      '-left-4',
      'opacity-0',
      'text-foreground-muted',
      'group-aria-selected:scale-[101%] group-aria-selected:opacity-100 group-aria-selected:left-0',
      'transition'
    )}
  />
)

const IconContainer = (
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) => (
  <div
    className={cn(
      'w-6 h-6',
      'bg-surface-100 border rounded',
      'flex items-center justify-center',
      'text-foreground-muted',
      'group-aria-selected:bg-surface-200 group-aria-selected:text-foreground-lighter group-aria-selected:[&_svg]:scale-[103%]',
      'transition'
    )}
    {...props}
  />
)

const DocsSearchPage = () => {
  const supabaseClient = useSupabaseClient()
  const { searchState, handleSearch, debouncedSearch, reset } = useDocsSearchLocal(supabaseClient)

  console.log('SEARCH STATE:', searchState)

  const setIsOpen = useSetCommandMenuOpen()
  const setQuery = useSetQuery()
  const query = useQuery()
  const previousQuery = usePrevious(query)

  const initialLoad = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useCrossCompatRouter()

  async function openLink(pageType: SearchResultType, link: string) {
    switch (pageType) {
      case 'markdown':
      case 'reference':
        if (BASE_PATH === '/docs') {
          router.push(link)
          setIsOpen(false)
        } else if (!BASE_PATH) {
          router.push(`/docs${link}`)
          setIsOpen(false)
        } else {
          window.open(`https://supabase.com/docs${link}`, '_blank', 'noreferrer,noopener')
          setIsOpen(false)
        }
        break
      case 'partner-integration':
        if (!BASE_PATH) {
          router.push(link)
          setIsOpen(false)
        } else {
          window.open(`https://supabase.com${link}`, '_blank', 'noreferrer,noopener')
          setIsOpen(false)
        }
        break
      case 'github-discussions':
        window.open(link, '_blank', 'noreferrer,noopener')
        setIsOpen(false)
        break
      default:
        throw new Error(`Unknown page type '${pageType}'`)
    }
  }

  function handleResetPrompt() {
    setQuery('')
    reset()
  }

  useEffect(() => {
    if (initialLoad.current) {
      // On first navigation into 'docs search' page, search immediately
      if (query) {
        handleSearch(query)
      }
      initialLoad.current = false
    } else if (query !== previousQuery) {
      debouncedSearch(query)
    }
  }, [query, handleSearch, debouncedSearch])

  // Immediately run search if user presses enter
  // and abort any debounced searches that are waiting
  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (
        event.key === 'Enter' &&
        document.activeElement === inputRef.current &&
        query &&
        // If there are results, cmdk menu will trigger navigation to the highlighted
        // result on Enter, even though the active element is the input
        searchState.status !== 'results' &&
        searchState.status !== 'stale'
      ) {
        event.preventDefault()
        debouncedSearch.cancel()
        handleSearch(query)
      }
    }

    inputRef.current?.addEventListener('keydown', handleEnter)
    return () => inputRef.current?.removeEventListener('keydown', handleEnter)
  }, [query, searchState.status])

  return (
    <CommandWrapper>
      <CommandHeader>
        <Breadcrumb />
        <CommandInput placeholder="Search..." ref={inputRef} />
      </CommandHeader>
      <CommandList_Shadcn_ className="max-h-[initial]">
        {(searchState.status === 'results' || searchState.status === 'stale') &&
          searchState.results.map((page, i) => {
            return (
              <CommandGroup_Shadcn_
                heading=""
                key={`${page.path}-group`}
                value={`${escapeAttributeSelector(page.title)}-group-index-${i}`}
                forceMount={true}
                className="overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted"
              >
                <CommandItem_Shadcn_
                  key={`${page.path}-item`}
                  value={`${escapeAttributeSelector(page.title)}-item-index-${i}`}
                  onSelect={() => {
                    openLink(page.type, page.path)
                  }}
                  forceMount={true}
                  className={cn(generateCommandClassNames(true), 'border border-overlay/90')}
                >
                  <div className="grow flex gap-3 items-center">
                    <IconContainer>{getPageIcon(page)}</IconContainer>
                    <div className="flex flex-col gap-0">
                      <TextHighlighter>{page.title}</TextHighlighter>
                      {(page.description || page.subtitle) && (
                        <div className="text-xs text-foreground-muted">
                          {page.description || page.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronArrow />
                </CommandItem_Shadcn_>
                {page.headings && page.headings.length > 0 && (
                  <div className="border-l border-muted ml-3 pt-3">
                    {page.headings.map((heading, index) => (
                      <CommandItem_Shadcn_
                        className={cn(
                          generateCommandClassNames(true),
                          'border border-overlay/90',
                          'ml-3 mb-3'
                        )}
                        onSelect={() => {
                          openLink(page.type, formatSectionUrl(page, heading))
                        }}
                        key={`${page.path}__${heading.title}-item`}
                        value={`${escapeAttributeSelector(page.title)}__${escapeAttributeSelector(heading.title)}-item-index-${i}`}
                        forceMount={true}
                      >
                        <div className="grow flex gap-3 items-center">
                          <IconContainer>{getPageSectionIcon(page)}</IconContainer>
                          <div className="flex flex-col gap-0">
                            <cite>
                              <TextHighlighter className="not-italic text-[10px] rounded-full px-2 py-1 bg-surface-300 text-foreground-muted">
                                {page.title}
                              </TextHighlighter>
                            </cite>
                            {heading.title && <TextHighlighter>{heading.title}</TextHighlighter>}
                          </div>
                        </div>
                        <ChevronArrow />
                      </CommandItem_Shadcn_>
                    ))}
                  </div>
                )}
              </CommandGroup_Shadcn_>
            )
          })}
        {searchState.status === 'initial' && (
          <CommandGroup_Shadcn_ className="overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted">
            {questions.map((question) => {
              const key = question.replace(/\s+/g, '_')
              return (
                <CommandItem_Shadcn_
                  className={generateCommandClassNames(false)}
                  onSelect={() => {
                    if (!query) {
                      handleSearch(question)
                      setQuery(question)
                    }
                  }}
                  key={key}
                >
                  <Search />
                  {question}
                </CommandItem_Shadcn_>
              )
            })}
          </CommandGroup_Shadcn_>
        )}
        {searchState.status === 'loading' && (
          <div className="flex items-center gap-3 my-4 justify-center">
            <Loader2 className="animate animate-spin text-foreground-muted" size={14} />
            <p className="text-sm text-foreground-muted text-center">Searching for results</p>
          </div>
        )}
        {searchState.status === 'empty' && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4 text-foreground-light">
            <StatusIcon variant="default" />
            <p className="text-sm text-foreground-light text-center">No results found.</p>
            <Button size="tiny" type="default" onClick={handleResetPrompt}>
              Try again?
            </Button>
          </div>
        )}
        {searchState.status === 'error' && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <StatusIcon variant="warning" />
            <p className="text-lg text-foreground-light">
              Sorry, looks like we&apos;re having some issues with search!
            </p>
            <p className="text-sm text-foreground-lighter">Please try again in a bit.</p>
            <Button size="tiny" type="default" onClick={handleResetPrompt}>
              Try again?
            </Button>
          </div>
        )}
      </CommandList_Shadcn_>
    </CommandWrapper>
  )
}

export function formatSectionUrl(page: SearchResult, section: SearchResultSubsection) {
  switch (page.type) {
    case 'markdown':
    case 'github-discussions':
      return `${page.path}#${section.slug ?? ''}`
    case 'reference':
      return `${page.path}/${section.slug ?? ''}`
    case 'partner-integration':
      // [Charis] Markdown headings on integrations pages don't have slugs yet
      return page.path
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageIcon(page: SearchResult) {
  switch (page.type) {
    case 'markdown':
    case 'reference':
    case 'partner-integration':
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case 'github-discussions':
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: SearchResult) {
  switch (page.type) {
    case 'markdown':
    case 'reference':
    case 'partner-integration':
      return <Hash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case 'github-discussions':
      return <MessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export { DocsSearchPage }
