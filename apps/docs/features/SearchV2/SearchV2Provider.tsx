'use client'

import type {
  DocsSearchV2AskAiClosedEvent,
  DocsSearchV2AskAiOpenedEvent,
} from 'common/telemetry-constants'
import { SearchDialog, useSearchShortcut } from 'docs-search/components'
import { useRouter } from 'next/navigation'
import { createContext, use, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

import { ASK_AI_DIALOG_LABELS, AskAiPanel } from './AskAiPanel'
import { SearchV2Panel } from './SearchV2Dialog'
import { ASK_AI_QUESTION_TELEMETRY_LENGTH } from './constants'
import { useSearchV2Dialog, type SearchV2CloseReason } from './useSearchV2Dialog'
import { useSendTelemetryEvent } from '@/lib/telemetry'

type SearchTriggerType = Parameters<ReturnType<typeof useSearchV2Dialog>['openDialog']>[0]

type AskAiTriggerType = DocsSearchV2AskAiOpenedEvent['properties']['triggerType']

interface SearchV2ContextValue {
  isSearchOpen: boolean
  isAskAiOpen: boolean
  showSearch: (triggerType: SearchTriggerType) => void
  showAskAi: (options: { triggerType: AskAiTriggerType; question?: string }) => void
}

type DialogPanel = 'search' | 'ask-ai'

interface SearchV2ProviderProps {
  children: ReactNode
}

const SearchV2Context = createContext<SearchV2ContextValue | null>(null)

/**
 * Owns the one search dialog on the page. The top bar renders two times (desktop and mobile).
 * One dialog per trigger let search and Ask AI open on top of each other.
 */
export function SearchV2Provider({ children }: SearchV2ProviderProps) {
  const router = useRouter()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const {
    open: isSearchOpen,
    openDialog: openSearch,
    handleOpenChange: handleSearchOpenChange,
  } = useSearchV2Dialog()
  const [isAskAiOpen, setIsAskAiOpen] = useState(false)
  const [askAiQuestion, setAskAiQuestion] = useState('')
  // the panel stays set after close, so the closing dialog does not show the other panel
  const [panel, setPanel] = useState<DialogPanel>('search')
  const isOpen = isSearchOpen || isAskAiOpen

  const showPanel = ({ next, update }: { next: DialogPanel; update: () => void }) => {
    const canMorph =
      isOpen &&
      panel !== next &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canMorph) {
      update()
      return
    }
    // dialog-morph.css in docs-search reads this to pick the roll direction
    const root = document.documentElement
    root.dataset.searchDialogMorph = next
    document
      .startViewTransition(() => flushSync(update))
      .finished.finally(() => delete root.dataset.searchDialogMorph)
  }

  const closeAskAi = (closeReason: DocsSearchV2AskAiClosedEvent['properties']['closeReason']) => {
    if (!isAskAiOpen) return
    setIsAskAiOpen(false)
    sendTelemetryEvent({ action: 'docs_search_v2_ask_ai_closed', properties: { closeReason } })
  }

  const showSearch = (triggerType: SearchTriggerType) =>
    showPanel({
      next: 'search',
      update: () => {
        closeAskAi('switched_to_search')
        setPanel('search')
        openSearch(triggerType)
      },
    })

  const showAskAi: SearchV2ContextValue['showAskAi'] = ({ triggerType, question = '' }) => {
    if (!isAskAiOpen) {
      sendTelemetryEvent({ action: 'docs_search_v2_ask_ai_opened', properties: { triggerType } })
    }
    if (question) {
      sendTelemetryEvent({
        action: 'docs_search_v2_ask_ai_question_submitted',
        properties: {
          question: question.slice(0, ASK_AI_QUESTION_TELEMETRY_LENGTH),
          questionLength: question.length,
          questionSource: 'search',
        },
      })
    }
    showPanel({
      next: 'ask-ai',
      update: () => {
        if (isSearchOpen) handleSearchOpenChange(false, 'switched_to_ask_ai')
        setAskAiQuestion(question)
        setPanel('ask-ai')
        setIsAskAiOpen(true)
      },
    })
  }

  const closeDialog = (
    closeReason: Extract<SearchV2CloseReason, 'dismissed' | 'result_navigated'>
  ) => {
    closeAskAi('dismissed')
    if (isSearchOpen) handleSearchOpenChange(false, closeReason)
  }

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) closeDialog('dismissed')
  }

  const handleResultNavigate = (path: string) => {
    router.push(path)
    closeDialog('result_navigated')
  }

  useSearchShortcut(() => showSearch('keyboard_shortcut'))
  useSearchShortcut(() => showAskAi({ triggerType: 'keyboard_shortcut' }), 'i')

  return (
    <SearchV2Context value={{ isSearchOpen, isAskAiOpen, showSearch, showAskAi }}>
      {children}
      <SearchDialog
        open={isOpen}
        onOpenChange={handleDialogOpenChange}
        labels={panel === 'ask-ai' ? ASK_AI_DIALOG_LABELS : undefined}
      >
        {panel === 'ask-ai' ? (
          <AskAiPanel initialQuestion={askAiQuestion} />
        ) : (
          <SearchV2Panel
            onResultNavigate={handleResultNavigate}
            onResultLinkNavigate={() => closeDialog('result_navigated')}
            onAskAi={showAskAi}
          />
        )}
      </SearchDialog>
    </SearchV2Context>
  )
}

export function useSearchV2(): SearchV2ContextValue {
  const context = use(SearchV2Context)
  if (!context) throw new Error('useSearchV2 must be used inside SearchV2Provider')
  return context
}
