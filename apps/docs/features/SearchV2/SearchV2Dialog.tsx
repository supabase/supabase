'use client'

import { useDocsSearchV2 } from 'common'
import {
  SearchDialog,
  SearchPanel,
  type SearchDialogProps,
  type SearchPanelProps,
} from 'docs-search/components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { SEARCH_V2_ENDPOINT } from './constants'
import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchV2DialogProps = Pick<SearchDialogProps, 'open' | 'onOpenChange'>

type SearchV2PanelProps = Pick<SearchPanelProps, 'onResultNavigate' | 'onResultLinkNavigate'>

export function SearchV2Dialog({ open, onOpenChange }: SearchV2DialogProps) {
  const router = useRouter()

  return (
    <SearchDialog open={open} onOpenChange={onOpenChange}>
      <SearchV2Panel
        onResultNavigate={(path) => {
          router.push(path)
          onOpenChange(false)
        }}
        onResultLinkNavigate={() => onOpenChange(false)}
      />
    </SearchDialog>
  )
}

function SearchV2Panel({ onResultNavigate, onResultLinkNavigate }: SearchV2PanelProps) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearchV2({
    endpoint: SEARCH_V2_ENDPOINT,
  })

  useEffect(() => {
    if (searchState.status === 'results' || searchState.status === 'noResults') {
      sendTelemetryEvent({
        action: 'docs_search_v2_search_submitted',
        properties: { query: searchState.query, hasResults: searchState.status === 'results' },
      })
    }
  }, [searchState, sendTelemetryEvent])

  return (
    <SearchPanel
      searchState={searchState}
      renderLink={(props) => <Link prefetch={false} {...props} />}
      onQueryChange={(query) => {
        if (query) {
          handleDocsSearchDebounced(query)
        } else {
          resetSearch()
        }
      }}
      onResultActivate={(result, { query }) =>
        sendTelemetryEvent({
          action: 'docs_search_v2_result_clicked',
          properties: { resultPath: result.path, query },
        })
      }
      onResultNavigate={(path) => onResultNavigate(path)}
      onResultLinkNavigate={() => onResultLinkNavigate?.()}
    />
  )
}
