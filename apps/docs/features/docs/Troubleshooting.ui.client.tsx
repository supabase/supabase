'use client'

import { CornerDownLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSerializer, parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { Fragment, useEffect, useMemo, useRef, useState, Suspense } from 'react'

import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Input_Shadcn_,
  cn,
  Admonition,
} from 'ui'

import { type ITroubleshootingEntry, type ITroubleshootingMetadata } from './Troubleshooting.utils'
import {
  TROUBLESHOOTING_DATA_ATTRIBUTE,
  TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY,
  TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW,
  TROUBLESHOOTING_ENTRIES_ID,
} from './Troubleshooting.utils.shared'

function useTroubleshootingSearchState() {
  const [filterState, setFilterState] = useQueryState(
    'keywords',
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [searchState, setSearchState] = useQueryState('search', parseAsString.withDefault(''))

  return { filterState, searchState, setFilterState, setSearchState }
}

function entryMatchesFilter(entry: HTMLElement, filterState: Array<string>, searchState: string) {
  const dataKeywords = entry.getAttribute('data-keywords')?.split(',') ?? []
  const content = entry.textContent ?? ''

  return (
    (filterState.length === 0 || filterState.some((keyword) => dataKeywords.includes(keyword))) &&
    (searchState === '' || content.toLowerCase().includes(searchState.toLowerCase()))
  )
}

interface TroubleshootingFilterProps {
  keywords: string[]
}

export function TroubleshootingFilter(props: TroubleshootingFilterProps) {
  return (
    <Suspense>
      <TroubleshootingFilterInternal {...props} />
    </Suspense>
  )
}

function TroubleshootingFilterInternal({ keywords }: TroubleshootingFilterProps) {
  const { filterState, searchState, setFilterState, setSearchState } =
    useTroubleshootingSearchState()

  const searchInputRef = useRef<HTMLInputElement | null>(null)

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
      const preview = entry.querySelector(
        `[${TROUBLESHOOTING_DATA_ATTRIBUTE}="${TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW}"]`
      )

      ;(preview as HTMLElement).style.pointerEvents = 'none'

      preview
        ?.querySelectorAll(
          'a,area,input,button,select,textarea,form,details,iframe,audio,video,[contenteditable]'
        )
        .forEach((element) => {
          ;(element as HTMLElement).inert = true
        })
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
    <>
      <h2 className="sr-only">Search and filter</h2>
      <label htmlFor="troubleshooting-search" className="sr-only">
        Filter by search term
      </label>
      <div className="relative">
        <Input_Shadcn_
          id="troubleshooting-search"
          ref={searchInputRef}
          type="text"
          placeholder="Search"
          className="pr-8"
          value={searchState}
          onChange={(e) => setSearchState(e.target.value || null)}
        />
        {searchState && (
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-light border hover:border-stronger rounded-md p-1 transition-colors"
            onClick={() => {
              setSearchState(null)
              searchInputRef.current?.focus()
            }}
          >
            <span className="sr-only">Clear search</span>
            <X size={16} />
          </button>
        )}
      </div>
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
                onClick={() => {
                  const newFilterState = filterState.filter((k) => k !== keyword)
                  setFilterState(newFilterState.length === 0 ? null : newFilterState)
                }}
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
                  const newFilterState = filterState.filter((k) => k !== keyword)
                  setFilterState(newFilterState.length === 0 ? null : newFilterState)
                }
              }}
            />
            <label htmlFor={keyword} className="cursor-pointer peer-checked:text-foreground-muted">
              {keyword}
            </label>
          </li>
        ))}
      </ul>
    </>
  )
}

export function TroubleshootingFilterEmptyState() {
  return (
    <Suspense>
      <TroubleshootingFilterEmptyStateInternal />
    </Suspense>
  )
}

function TroubleshootingFilterEmptyStateInternal() {
  const { filterState, searchState } = useTroubleshootingSearchState()
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
    <Admonition type="note">No results found</Admonition>
  ) : numberResults > 0 ? (
    <span className="sr-only">
      {numberResults} {numberResults === 1 ? 'result' : 'results'}
    </span>
  ) : null
}

const searchSchema = { search: parseAsString }
const serializeSearch = createSerializer(searchSchema)

export function TroubleshootingGlobalSearch() {
  const [searchValue, setSearchValue] = useState('')
  const showSearchHint = searchValue !== ''

  const router = useRouter()
  const link = serializeSearch('/guides/troubleshooting', { search: searchValue })

  return (
    <>
      <label htmlFor="troubleshooting-global-search" className="sr-only">
        Seach for more troubleshooting topics
      </label>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(link)
        }}
      >
        <Input_Shadcn_
          id="troubleshooting-global-search"
          type="text"
          placeholder="Search for more"
          className="pr-8"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        {showSearchHint && (
          <button className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-light border hover:border-stronger rounded-md p-1 transition-colors">
            <span className="sr-only">Submit search</span>
            <CornerDownLeft size={16} />
          </button>
        )}
      </form>
    </>
  )
}

interface TroubleshootingEntryAssociatedErrorsProps {
  errors: ITroubleshootingMetadata['errors']
}

export function TroubleshootingEntryAssociatedErrors(
  props: TroubleshootingEntryAssociatedErrorsProps
) {
  return (
    <Suspense>
      <TroubleshootingEntryAssociatedErrorsInternal {...props} />
    </Suspense>
  )
}

function TroubleshootingEntryAssociatedErrorsInternal({
  errors,
}: TroubleshootingEntryAssociatedErrorsProps) {
  const [expandedState, setExpandedState] = useState<
    { expanded: false } | { agent: 'user' | 'app'; expanded: true }
  >({ expanded: false })
  const expansionTriggerredByUser = useRef(false)
  const hiddenErrorsRef = useRef<HTMLDivElement | null>(null)
  const firstExpandedItem = useRef<HTMLLIElement | null>(null)

  const { searchState } = useTroubleshootingSearchState()
  useEffect(() => {
    if (searchState !== '' && entryMatchesFilter(hiddenErrorsRef.current, [], searchState)) {
      if (!expandedState.expanded) {
        setExpandedState({ agent: 'app', expanded: true })
      }
    } else if (searchState === '' && expandedState.expanded && expandedState.agent === 'app') {
      setExpandedState({ expanded: false })
    }
  }, [searchState, expandedState])

  const longErrorsList = errors.length > 2
  const Wrapper = useMemo(() => {
    return longErrorsList ? Collapsible_Shadcn_ : Fragment
  }, [longErrorsList])

  return (
    <div className="p-[var(--local-padding)]">
      <h3 className="m-0 pb-1 text-sm text-foreground-lighter italic">Related errors</h3>
      <ul className="text-sm p-0 m-0">
        <Wrapper
          // @ts-expect-error: passing ignored props to Fragment
          open={expandedState.expanded}
          onOpenChange={(requestingExpand) => {
            if (requestingExpand) {
              setExpandedState({
                agent: expansionTriggerredByUser.current ? 'user' : 'app',
                expanded: true,
              })
              expansionTriggerredByUser.current = false
            } else {
              setExpandedState({ expanded: false })
            }
          }}
        >
          {errors.slice(0, 2).map((error, index) => (
            <li key={index} className="line-clamp-1">
              <span className="font-mono mr-2">{`${error.http_status_code} ${error.code}`}</span>
              {error.message}
            </li>
          ))}
          {longErrorsList && (
            <>
              {/* Force mount so the content is available in the DOM for search */}
              <CollapsibleContent_Shadcn_
                forceMount
                className="data-[state=closed]:hidden"
                ref={hiddenErrorsRef}
              >
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
                    expansionTriggerredByUser.current = true
                    setTimeout(() => {
                      firstExpandedItem.current?.focus()
                    })
                  }}
                >
                  {expandedState ? 'Show less' : 'Show more'}
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
