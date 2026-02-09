'use client'

import {
  DocsSearchResultType as PageType,
  useDocsSearch,
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
} from 'common'
import { Book, ChevronRight, Github, Hash, Loader2, MessageSquare, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button, cn, CommandGroup_Shadcn_, CommandItem_Shadcn_, CommandList_Shadcn_ } from 'ui'
import { StatusIcon } from 'ui/src/components/StatusIcon'

import {
  Breadcrumb,
  CommandHeader,
  CommandInput,
  CommandWrapper,
  escapeAttributeSelector,
  generateCommandClassNames,
  TextHighlighter,
  useCrossCompatRouter,
  useQuery,
  useSetCommandMenuOpen,
  useSetQuery,
} from '../..'
import { BASE_PATH } from '../shared/constants'

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
  const {
    searchState: state,
    handleDocsSearch: handleSearch,
    handleDocsSearchDebounced: debouncedSearch,
    resetSearch,
  } = useDocsSearch()
  const setIsOpen = useSetCommandMenuOpen()
  const setQuery = useSetQuery()
  const query = useQuery()

  const initialLoad = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useCrossCompatRouter()

  async function openLink(pageType: PageType, link: string) {
    switch (pageType) {
      case PageType.Markdown:
      case PageType.Reference:
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
      case PageType.Integration:
        if (!BASE_PATH) {
          router.push(link)
          setIsOpen(false)
        } else {
          window.open(`https://supabase.com${link}`, '_blank', 'noreferrer,noopener')
          setIsOpen(false)
        }
        break
      case PageType.GithubDiscussion:
        window.open(link, '_blank', 'noreferrer,noopener')
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
    setQuery('')
    resetSearch()
  }

  useEffect(() => {
    if (initialLoad.current) {
      // On first navigation into 'docs search' page, search immediately
      if (query) {
        handleSearch(query)
      }
      initialLoad.current = false
    } else if (query) {
      // Else if user is typing, debounce search
      debouncedSearch(query)
    } else {
      // If user clears search, reset results
      resetSearch()
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
        !hasResults
      ) {
        event.preventDefault()
        debouncedSearch.cancel()
        handleSearch(query)
      }
    }

    inputRef.current?.addEventListener('keydown', handleEnter)
    return () => inputRef.current?.removeEventListener('keydown', handleEnter)
  }, [query, hasResults])

  return (
    <CommandWrapper>
      <CommandHeader>
        <Breadcrumb />
        <CommandInput placeholder="Search..." ref={inputRef} />
      </CommandHeader>
      <CommandList_Shadcn_ className="max-h-[initial]">
        {hasResults &&
          ('results' in state ? state.results : state.staleResults).map((page, i) => {
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
                {page.sections.length > 0 && (
                  <div className="border-l border-muted ml-3 pt-3">
                    {page.sections.map((section, i) => (
                      <CommandItem_Shadcn_
                        className={cn(
                          generateCommandClassNames(true),
                          'border border-overlay/90',
                          'ml-3 mb-3'
                        )}
                        onSelect={() => {
                          openLink(page.type, formatSectionUrl(page, section))
                        }}
                        key={`${page.path}__${section.heading}-item`}
                        value={`${escapeAttributeSelector(page.title)}__${escapeAttributeSelector(section.heading)}-item-index-${i}`}
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
                            {section.heading && (
                              <TextHighlighter>{section.heading}</TextHighlighter>
                            )}
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
        {state.status === 'initial' && (
          <CommandGroup_Shadcn_ className="overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted">
            {questions.map((question) => {
              const key = question.replace(/\s+/g, '_')
              return (
                <CommandItem_Shadcn_
                  className={generateCommandClassNames(false)}
                  disabled={hasResults}
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
        {state.status === 'loading' && state.staleResults.length === 0 && (
          <div className="flex items-center gap-3 my-4 justify-center">
            <Loader2 className="animate animate-spin text-foreground-muted" size={14} />
            <p className="text-sm text-foreground-muted text-center">Searching for results</p>
          </div>
        )}
        {state.status === 'noResults' && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4 text-foreground-light">
            <StatusIcon variant="default" />
            <p className="text-sm text-foreground-light text-center">No results found.</p>
            <Button size="tiny" type="default" onClick={handleResetPrompt}>
              Try again?
            </Button>
          </div>
        )}
        {state.status === 'error' && (
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

export function formatSectionUrl(page: Page, section: PageSection) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.GithubDiscussion:
      return `${page.path}#${section.slug ?? ''}`
    case PageType.Reference:
      return `${page.path}/${section.slug ?? ''}`
    case PageType.Integration:
      // [Charis] Markdown headings on integrations pages don't have slugs yet
      return page.path
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

export { DocsSearchPage }
