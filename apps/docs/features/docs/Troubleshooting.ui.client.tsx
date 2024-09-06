'use client'

import { X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'

import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Input_Shadcn_,
  cn,
} from 'ui'

import { type ITroubleshootingEntry, type ITroubleshootingMetadata } from './Troubleshooting.utils'
import {
  TROUBLESHOOTING_DATA_ATTRIBUTE,
  TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY,
  TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW,
  TROUBLESHOOTING_ENTRIES_ID,
} from './Troubleshooting.utils.shared'
import Link from 'next/link'

// Create a context for filter and search state
const TroubleshootingContext = createContext<
  | {
      filterState: string[]
      searchState: string
      setFilterState: (state: string[]) => void
      setSearchState: (state: string) => void
    }
  | undefined
>(undefined)

// Create a provider component
export function TroubleshootingFilterStateProvider({ children }: { children: React.ReactNode }) {
  const [filterState, setFilterState] = useState<Array<string>>([])
  const [searchState, setSearchState] = useState('')

  return (
    <TroubleshootingContext.Provider
      value={{ filterState, searchState, setFilterState, setSearchState }}
    >
      {children}
    </TroubleshootingContext.Provider>
  )
}

// Custom hook to use the context
function useTroubleshootingContext() {
  const context = useContext(TroubleshootingContext)
  if (context === undefined) {
    throw new Error('useTroubleshootingContext must be used within a TroubleshootingProvider')
  }
  return context
}

function entryMatchesFilter(entry: HTMLElement, filterState: Array<string>, searchState: string) {
  const dataKeywords = entry.getAttribute('data-keywords')?.split(',') ?? []
  const content = entry.textContent ?? ''

  return (
    (filterState.length === 0 || filterState.some((keyword) => dataKeywords.includes(keyword))) &&
    (searchState === '' || content.toLowerCase().includes(searchState.toLowerCase()))
  )
}

export function TroubleshootingFilter({
  keywords,
  className,
}: {
  keywords: string[]
  className?: string
}) {
  const { filterState, searchState, setFilterState, setSearchState } = useTroubleshootingContext()

  const allTroubleshootingEntries = useRef<Array<HTMLElement>>([])

  /* This is done with imperative DOM manipulation so the previews can be
  rendered server-side with remote MDX. */
  useEffect(() => {
    allTroubleshootingEntries.current = Array.from(
      document.querySelectorAll(
        `#${TROUBLESHOOTING_ENTRIES_ID} [${TROUBLESHOOTING_DATA_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY}"]`
      )
    )
    allTroubleshootingEntries.current.forEach((entry) => {
      entry
        .querySelector(
          `[${TROUBLESHOOTING_DATA_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW}"]`
        )
        ?.querySelectorAll(
          'a,area,input,button,select,textarea,form,details,iframe,audio,video,[contenteditable]'
        )
        .forEach((element) => ((element as HTMLElement).inert = true))
    })
  }, [])

  useEffect(() => {
    if (filterState.length === 0 && searchState === '') {
      allTroubleshootingEntries.current.forEach((entry) => {
        entry.hidden = false
      })
      return
    }

    allTroubleshootingEntries.current.forEach((entry) => {
      if (entryMatchesFilter(entry, filterState, searchState)) {
        entry.hidden = false
      } else {
        entry.hidden = true
      }
    })
  }, [filterState, searchState])

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <h2 className="sr-only">Search and filter</h2>
      <label htmlFor="troubleshooting-search" className="sr-only">
        Filter by search term
      </label>
      <Input_Shadcn_
        id="troubleshooting-search"
        type="text"
        placeholder="Search"
        onChange={(e) => setSearchState(e.target.value)}
      />
      <h3 className="sr-only">Filter by keyword</h3>
      <h4 className="sr-only">Applied filters</h4>
      <ul className="flex flex-wrap items-center gap-2">
        {filterState.length === 0 ? (
          <li className="border rounded-md px-2 py-1.5 text-foreground-lighter text-sm">
            No filters applied
          </li>
        ) : (
          filterState.map((keyword) => (
            <li key={keyword}>
              <button
                className="group border rounded px-2 py-1.5 text-foreground-lighter hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                onClick={() => setFilterState(filterState.filter((k) => k !== keyword))}
              >
                {keyword}
                <X
                  size={12}
                  className="translate-y-px group-hover:scale-105 transition-transform"
                  aria-label="Remove filter"
                />
              </button>
            </li>
          ))
        )}
      </ul>
      <h4 className="sr-only">Available filters</h4>
      <ul className="text-foreground-light">
        {keywords.map((keyword) => (
          <li key={keyword} className="hover:text-foreground transition-colors">
            <input
              type="checkbox"
              id={keyword}
              checked={filterState.includes(keyword)}
              className="sr-only peer"
              onChange={(e) => {
                if (e.target.checked) {
                  setFilterState([...filterState, keyword])
                } else {
                  setFilterState(filterState.filter((k) => k !== keyword))
                }
              }}
            />
            <label htmlFor={keyword} className="cursor-pointer peer-checked:text-foreground-muted">
              {keyword}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TroubleshootingFilterEmptyState() {
  const { filterState, searchState } = useTroubleshootingContext()
  const allTroubleshootingEntries = useRef<Array<HTMLElement>>([])

  const [numberResults, setNumberResults] = useState<number | undefined>(undefined)

  useEffect(() => {
    allTroubleshootingEntries.current = Array.from(
      document.querySelectorAll(
        `#${TROUBLESHOOTING_ENTRIES_ID} [${TROUBLESHOOTING_DATA_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY}"]`
      )
    )
  }, [])

  useEffect(() => {
    const numberResults = allTroubleshootingEntries.current.filter((entry) => !entry.hidden).length
    setNumberResults(numberResults)
  }, [filterState, searchState])

  return numberResults === 0 ? (
    <span>No results found</span>
  ) : numberResults > 0 ? (
    <span className="sr-only">
      {numberResults} {numberResults === 1 ? 'result' : 'results'}
    </span>
  ) : null
}

export function TroubleshootingEntryAssociatedErrors({
  errors,
}: {
  errors: ITroubleshootingMetadata['errors']
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const firstExpandedItem = useRef<HTMLLIElement | null>(null)

  const longErrorsList = errors.length > 2
  const Wrapper = useMemo(() => {
    return longErrorsList ? Collapsible_Shadcn_ : Fragment
  }, [longErrorsList])

  return (
    <div className="p-[var(--local-padding)]">
      <h3 className="m-0 pb-1 text-sm text-foreground-lighter italic">Related errors</h3>
      <ul className="text-sm p-0 m-0">
        {/* @ts-expect-error: passing ignored props to Fragment */}
        <Wrapper open={isExpanded} onOpenChange={setIsExpanded}>
          {errors.slice(0, 2).map((error, index) => (
            <li key={index} className="line-clamp-1">
              <span className="font-mono mr-2">{`${error.http_status_code} ${error.code}`}</span>
              {error.message}
            </li>
          ))}
          {longErrorsList && (
            <>
              {/* Force mount so the content is available in the DOM for search */}
              <CollapsibleContent_Shadcn_ forceMount className="data-[state=closed]:hidden">
                {errors.slice(2).map((error, index) => (
                  <li
                    key={index}
                    ref={index === 0 ? firstExpandedItem : null}
                    tabIndex={-1}
                    className="line-clamp-1"
                  >
                    <span className="font-mono mr-2">{`${error.http_status_code} ${error.code}`}</span>
                    {error.message}
                  </li>
                ))}
              </CollapsibleContent_Shadcn_>
              <CollapsibleTrigger_Shadcn_ asChild>
                <button
                  className="text-sm text-foreground-lighter"
                  onClick={() => {
                    setTimeout(() => {
                      firstExpandedItem.current?.focus()
                    })
                  }}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              </CollapsibleTrigger_Shadcn_>
            </>
          )}
        </Wrapper>
      </ul>
    </div>
  )
}

export function TroubleshootingErrorListDetailed({
  errors,
  className,
}: {
  errors: ITroubleshootingEntry['data']['errors']
  className?: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const longErrorsList = errors.length > 2
  const expandedContentId = 'troubleshooting-error-list-detailed-expanded-content'

  return (
    <aside className={cn('not-prose', className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="uppercase tracking-wider text-xs text-foreground-light">Related errors</h2>
        <button
          className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-controls={expandedContentId}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
      <table className="[&_td]:pr-2 [&_td]:text-foreground-light [&_td]:text-sm">
        <thead className="sr-only">
          <tr>
            <th>HTTP Status Code</th>
            <th>Error Code</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {errors.slice(0, 2).map((error, index) => (
            <tr key={index}>
              <td className="font-mono">{error.http_status_code}</td>
              <td className="font-mono">{error.code}</td>
              <td>{error.message}</td>
            </tr>
          ))}
        </tbody>
        {longErrorsList && isExpanded && (
          <tbody id={expandedContentId}>
            {errors.slice(2).map((error, index) => (
              <tr key={index}>
                <td className="font-mono">{error.http_status_code}</td>
                <td className="font-mono">{error.code}</td>
                <td>{error.message}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </aside>
  )
}

export function TroubleshootingBackLink({
  className,
  direction = 'left',
}: {
  className?: string
  direction?: 'left' | 'right'
}) {
  const [href, setHref] = useState('/guides/troubleshooting')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const returnTo = searchParams.get('returnTo')
    if (returnTo) {
      setHref(returnTo)
    }
  }, [])

  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-1 text-sm text-foreground-lighter', className)}
    >
      {direction === 'left' ? '‹ More troubleshooting' : 'More troubleshooting ›'}
    </Link>
  )
}
