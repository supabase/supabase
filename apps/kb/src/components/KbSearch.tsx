import { IS_PLATFORM } from 'common/constants'
import { useDocsSearchV2 } from 'common/hooks/useDocsSearchV2'
import { useMountEffect } from 'common/hooks/useMountEffect'
import type { TelemetryEvent } from 'common/telemetry-constants'
import { buildTelemetryEventRequest } from 'common/telemetry-event'
import {
  getVisibleResults,
  SearchDialog,
  SearchPanel,
  useSearchShortcut,
  type SearchLabels,
} from 'docs-search/components'
import { useCallback, useEffect, useState } from 'react'

import { KB_SEARCH_MIN_CHARACTERS, KB_SEARCH_URL, reshapeKbResult } from '../lib/search'

interface KbSearchDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const OPEN_SEARCH_EVENT = 'kb-search:open'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

const sendKbTelemetryEvent = (event: TelemetryEvent) => {
  if (!IS_PLATFORM) return
  const request = buildTelemetryEventRequest(API_URL, event, window.location.pathname)
  if (!request) return
  fetch(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Version: '2' },
    credentials: 'include',
    keepalive: request.keepalive,
    body: JSON.stringify(request.body),
  }).catch(() => {})
}

const LABELS: Partial<SearchLabels> = {
  dialogTitle: 'Search the knowledge base',
  dialogDescription: 'Search guides and troubleshooting articles',
  inputPlaceholder: 'Search guides...',
  inputLabel: 'Search the knowledge base',
  searching: 'Searching the knowledge base…',
  noResults: 'No results found. Try a shorter or different term.',
  error: 'Search failed. Check your connection and try again.',
}

// mounted once in layout so every page shares one dialog shortcut
export const KbSearch = () => {
  const [isOpen, setIsOpen] = useState(false)
  const handleShortcut = useCallback(() => setIsOpen((isOpen) => !isOpen), [])

  useSearchShortcut(handleShortcut)

  useMountEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, handleOpen)
  })

  return <KbSearchDialog isOpen={isOpen} onOpenChange={setIsOpen} />
}

// search triggers live in other islands, so they reach the dialog through a window event
export const openKbSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))

const KbSearchDialog = ({ isOpen, onOpenChange }: KbSearchDialogProps) => (
  <SearchDialog open={isOpen} onOpenChange={onOpenChange} labels={LABELS}>
    <KbSearchPanel onOpenChange={onOpenChange} />
  </SearchDialog>
)

// mounted only while the dialog is open, so closing it drops the search state
const KbSearchPanel = ({ onOpenChange }: Pick<KbSearchDialogProps, 'onOpenChange'>) => {
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearchV2({
    endpoint: KB_SEARCH_URL,
    reshape: reshapeKbResult,
  })

  useEffect(() => {
    if (searchState.status !== 'results' && searchState.status !== 'noResults') return
    const resultCount = searchState.status === 'results' ? searchState.results.length : 0
    sendKbTelemetryEvent({
      action: 'kb_search_submitted',
      properties: {
        queryLength: searchState.query.length,
        resultCount,
        hasResults: resultCount > 0,
      },
    })
  }, [searchState])

  return (
    <SearchPanel
      searchState={searchState}
      labels={LABELS}
      minCharacters={KB_SEARCH_MIN_CHARACTERS}
      onQueryChange={(query) => (query ? handleDocsSearchDebounced(query) : resetSearch())}
      onResultActivate={(result) => {
        const results = getVisibleResults(searchState)
        sendKbTelemetryEvent({
          action: 'kb_search_result_clicked',
          properties: {
            resultPath: result.path,
            resultPosition: results.findIndex(({ path }) => path === result.path) + 1,
            resultCount: results.length,
          },
        })
      }}
      onResultNavigate={(path) => window.location.assign(path)}
      onResultLinkNavigate={() => onOpenChange(false)}
    />
  )
}
