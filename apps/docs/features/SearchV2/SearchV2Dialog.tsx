'use client'

import { useDocsSearchV2 } from 'common'
import type { DocsSearchV2AskAiOpenedEvent } from 'common/telemetry-constants'
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

import { AskAiIcon } from './AskAiIcon'
import { SEARCH_V2_ENDPOINT, SEARCH_V2_MIN_CHARACTERS } from './constants'
import type { SearchV2CloseReason } from './useSearchV2Dialog'
import { useSendTelemetryEvent } from '@/lib/telemetry'

interface SearchV2DialogProps extends Pick<SearchDialogProps, 'open'> {
  onOpenChange: (open: boolean, closeReason?: SearchV2CloseReason) => void
}

interface SearchV2PanelProps extends Pick<
  SearchPanelProps,
  'onResultNavigate' | 'onResultLinkNavigate'
> {
  onAskAi?: (options: {
    triggerType: DocsSearchV2AskAiOpenedEvent['properties']['triggerType']
    question: string
  }) => void
}

export function SearchV2Dialog({ open, onOpenChange }: SearchV2DialogProps) {
  const router = useRouter()

  return (
    <SearchDialog open={open} onOpenChange={onOpenChange}>
      <SearchV2Panel
        onResultNavigate={(path) => {
          router.push(path)
          onOpenChange(false, 'result_navigated')
        }}
        onResultLinkNavigate={() => onOpenChange(false, 'result_navigated')}
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
              <>
                No results found for “{query}”.{' '}
                <SearchActionItem
                  icon={<AskAiIcon isThinking={false} className="size-3.5" />}
                  onSelect={() => onAskAi({ triggerType: 'no_results_item', question: query })}
                >
                  Ask Supabase AI
                </SearchActionItem>
              </>
            )
          : undefined
      }
      renderFooterStart={
        onAskAi
          ? ({ query }) => (
              <button
                type="button"
                tabIndex={0}
                onClick={() => onAskAi({ triggerType: 'results_footer_button', question: query })}
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
