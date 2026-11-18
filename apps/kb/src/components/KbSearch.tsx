import { useDocsSearchV2 } from 'common/hooks/useDocsSearchV2'
import { useMountEffect } from 'common/hooks/useMountEffect'
import type { KbSearchClosedEvent, KbSearchOpenedEvent } from 'common/telemetry-constants'
import {
  getVisibleResults,
  SearchDialog,
  SearchPanel,
  useSearchShortcut,
  type SearchLabels,
} from 'docs-search/components'
import { useCallback, useEffect, useRef, useState } from 'react'

import { KB_SEARCH_MIN_CHARACTERS, KB_SEARCH_URL, reshapeKbResult } from '../lib/search'
import { sendKbTelemetryEvent } from '../lib/telemetry'

type KbSearchTriggerType = KbSearchOpenedEvent['properties']['triggerType']
type KbSearchCloseReason = KbSearchClosedEvent['properties']['closeReason']

interface KbSearchDialogProps {
  isOpen: boolean
  onClose: (closeReason?: KbSearchCloseReason) => void
}

const OPEN_SEARCH_EVENT = 'kb-search:open'

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
  // the window listener is registered once, so it reads open state from a ref
  const isOpenRef = useRef(false)

  const openSearch = useCallback((triggerType: KbSearchTriggerType) => {
    if (isOpenRef.current) return
    isOpenRef.current = true
    setIsOpen(true)
    sendKbTelemetryEvent({ action: 'kb_search_opened', properties: { triggerType } })
  }, [])

  const closeSearch = useCallback((closeReason: KbSearchCloseReason = 'dismissed') => {
    if (!isOpenRef.current) return
    isOpenRef.current = false
    setIsOpen(false)
    sendKbTelemetryEvent({ action: 'kb_search_closed', properties: { closeReason } })
  }, [])

  const handleShortcut = useCallback(
    () => (isOpenRef.current ? closeSearch() : openSearch('keyboard_shortcut')),
    [closeSearch, openSearch]
  )

  useSearchShortcut(handleShortcut)

  useMountEffect(() => {
    const handleOpen = () => openSearch('search_input')
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, handleOpen)
  })

  return <KbSearchDialog isOpen={isOpen} onClose={closeSearch} />
}

// search triggers live in other islands, so they reach the dialog through a window event
export const openKbSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))

const KbSearchDialog = ({ isOpen, onClose }: KbSearchDialogProps) => (
  <SearchDialog open={isOpen} onOpenChange={(open) => !open && onClose()} labels={LABELS}>
    <KbSearchPanel onClose={onClose} />
  </SearchDialog>
)

// mounted only while the dialog is open, so closing it drops the search state
const KbSearchPanel = ({ onClose }: Pick<KbSearchDialogProps, 'onClose'>) => {
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
        query: searchState.query,
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
      onResultNavigate={(path) => {
        onClose('result_navigated')
        window.location.assign(path)
      }}
      onResultLinkNavigate={() => onClose('result_navigated')}
    />
  )
}
