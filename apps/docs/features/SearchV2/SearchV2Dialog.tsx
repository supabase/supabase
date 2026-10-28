'use client'

import { useDocsSearchV2 } from 'common'
import {
  SearchActionItem,
  SearchDialog,
  SearchPanel,
  type SearchDialogProps,
  type SearchPanelProps,
} from 'docs-search/components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { SEARCH_V2_ENDPOINT, SEARCH_V2_MIN_CHARACTERS } from './constants'
import { AskAiIcon } from './AskAiIcon'
import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchV2DialogProps = Pick<SearchDialogProps, 'open' | 'onOpenChange'>

interface SearchV2PanelProps extends Pick<
  SearchPanelProps,
  'onResultNavigate' | 'onResultLinkNavigate'
> {
  onAskAi?: (question: string) => void
}

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

export function SearchV2Panel({
  onResultNavigate,
  onResultLinkNavigate,
  onAskAi,
}: SearchV2PanelProps) {
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
      minCharacters={SEARCH_V2_MIN_CHARACTERS}
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
      renderNoResults={
        onAskAi
          ? ({ query }) => (
              <SearchActionItem
                icon={<AskAiIcon isThinking={false} className="size-4 shrink-0" />}
                onSelect={() => onAskAi(query)}
              >
                Ask Supabase AI: {query}
              </SearchActionItem>
            )
          : undefined
      }
      renderFooterStart={
        onAskAi
          ? ({ query }) => (
              <button
                type="button"
                tabIndex={0}
                onClick={() => onAskAi(query)}
                className="relative -mx-2 cursor-pointer rounded-md px-2 py-1 text-foreground-light transition-colors duration-150 hover:bg-overlay-hover hover:text-foreground focus-ring"
              >
                Ask Supabase AI
              </button>
            )
          : undefined
      }
    />
  )
}
