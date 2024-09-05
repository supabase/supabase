'use client'

import { useEffect, useRef, useState } from 'react'

import { Input_Shadcn_ } from 'ui'

export const TROUBLESHOOTING_ENTRIES_ID = 'sb-docs-troubleshooting-entries'
export const TROUBLESHOOTING_ENTRY_ID = 'sb-docs-troubleshooting-entry'

function entryMatchesFilter(entry: HTMLElement, filterState: Array<string>, searchState: string) {
  const dataKeywords = entry.getAttribute('data-keywords')?.split(',') ?? []
  const content = entry.textContent ?? ''

  return (
    (filterState.length === 0 || filterState.some((keyword) => dataKeywords.includes(keyword))) &&
    (searchState === '' || content.includes(searchState))
  )
}

export function TroubleshootingFilter({ keywords }: { keywords: string[] }) {
  const [filterState, setFilterState] = useState<Array<string>>([])
  const [searchState, setSearchState] = useState('')

  const allTroubleshootingEntries = useRef<Array<HTMLElement>>([])

  /* This is done with imperative DOM manipulation so the previews can be
  rendered server-side with remote MDX. */
  useEffect(() => {
    allTroubleshootingEntries.current = Array.from(
      document.querySelectorAll(`#${TROUBLESHOOTING_ENTRIES_ID} #${TROUBLESHOOTING_ENTRY_ID}`)
    )
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
    <div>
      <Input_Shadcn_
        type="text"
        placeholder="Search"
        onChange={(e) => setSearchState(e.target.value)}
      />
      <pre>{JSON.stringify(filterState)}</pre>
      <ul>
        {keywords.map((keyword) => (
          <li key={keyword}>
            <input
              type="checkbox"
              id={keyword}
              checked={filterState.includes(keyword)}
              className="sr-only"
              onChange={(e) => {
                if (e.target.checked) {
                  setFilterState([...filterState, keyword])
                } else {
                  setFilterState(filterState.filter((k) => k !== keyword))
                }
              }}
            />
            <label htmlFor={keyword} className="cursor-pointer">
              {keyword}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TroubleshootingFilterEmptyState() {}
