import type { UIMessage as MessageType } from '@ai-sdk/react'
import { useParams } from 'common/hooks'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'

import { AIAssistantHeader } from './AIAssistantHeader'
import { AssistantChat } from './AssistantChat'
import { resolveSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
import {
  ASSISTANT_HANDOFF_QUERY_PARAM,
  buildSupportAssistantPrompt,
  consumeAssistantHandoff,
} from '@/components/interfaces/Support/SupportAssistant.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantState, useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import type { SqlSnippet } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

interface AIAssistantProps {
  initialMessages?: MessageType[] | undefined
  className?: string
}

type CurrentQuerySnippet = Exclude<SqlSnippet, string>

const isSameSnippet = (snippet: SqlSnippet, currentQuery: CurrentQuerySnippet) =>
  typeof snippet !== 'string' &&
  snippet.label === currentQuery.label &&
  snippet.content === currentQuery.content &&
  snippet.source === currentQuery.source

export const AIAssistant = ({ className }: AIAssistantProps) => {
  const router = useRouter()
  const { id: entityId, source: sourceParam, ref: routeRef } = useParams()
  const snap = useAiAssistantStateSnapshot()
  const state = useAiAssistantState()
  const { snippets } = useSqlEditorV2StateSnapshot()
  const { activeSidebar, closeSidebar } = useSidebarManagerSnapshot()
  const shortcutsEnabled = activeSidebar?.id === SIDEBAR_KEYS.AI_ASSISTANT

  const handleNewChat = () => state.newChat()

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_NEW_CHAT, handleNewChat, {
    enabled: shortcutsEnabled,
  })

  const isInSQLEditor = router.pathname.includes('/sql/[id]')
  const snippet = snippets[entityId ?? '']
  const snippetContent = snippet?.snippet?.content?.unchecked_sql
  const openSnippetSource = isInSQLEditor
    ? resolveSnippetSource(snippet?.snippet, sourceParam)
    : undefined

  const processAssistantHandoff = useEffectEvent((handoffToken: string) => {
    const request = consumeAssistantHandoff(handoffToken)

    // A handoff link binds its target project to `request.projectRef`. Reject (and still
    // clean up) any handoff that ends up on a different project's page — a stale link, or
    // one edited/replayed by hand — rather than creating a chat tagged with the wrong project.
    if (request && request.projectRef === routeRef) {
      const newChatId = state.newChat({
        name: 'Support request',
        initialMessage: buildSupportAssistantPrompt(request),
      })

      const chat = state.chats[newChatId]
      if (chat) {
        chat.supportMetadata = {
          subject: request.subject,
          category: request.category,
          severity: request.severity,
          organizationSlug: request.organizationSlug,
          projectRef: request.projectRef,
          library: request.library,
          affectedServices: request.affectedServices,
          allowSupportAccess: request.allowSupportAccess,
          frontConversationId: request.frontConversationId,
          threadRef: request.threadRef,
          isSupportChat: true,
          lifecycleStatus: 'bot_active',
          lastSyncedMessageCount: 0,
          isSyncing: false,
          isLifecycleSyncing: false,
        }

        void import('@/state/ai-chat-front-sync')
          .then(({ syncSupportChatToFront }) => syncSupportChatToFront(newChatId, state))
          .catch(() => {})
      }

      state.selectChat(newChatId)
    } else {
      // The token didn't resolve (e.g. the link was opened in a new tab, so this tab's
      // sessionStorage never had it) or belonged to a different project. Start a new chat
      // rather than silently leaving whichever chat happened to be active for this project —
      // landing on an unrelated older conversation with no indication anything went wrong
      // is worse than an empty one.
      state.newChat()
      toast.error("Couldn't load your ticket context here — started a new chat instead.")
    }

    const { [ASSISTANT_HANDOFF_QUERY_PARAM]: _handledParam, ...restQuery } = router.query
    router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
  })

  // Picks up a support chat handed off from an org-level support page. Waits for
  // `isInitialized` since the assistant state's IndexedDB restore overwrites
  // `state.chats`/`activeChatId` wholesale once it resolves, which would wipe out a chat
  // created here if this ran first.
  useEffect(() => {
    if (!snap.isInitialized) return

    const handoffToken = router.query[ASSISTANT_HANDOFF_QUERY_PARAM]
    if (typeof handoffToken !== 'string') return

    processAssistantHandoff(handoffToken)
  }, [snap.isInitialized, router.query[ASSISTANT_HANDOFF_QUERY_PARAM]])

  useEffect(() => {
    if (!shortcutsEnabled || !isInSQLEditor || !snippetContent) return

    const currentQuery = {
      label: 'Current Query',
      content: snippetContent,
      source: openSnippetSource,
    }
    state.setSqlSnippets([currentQuery])

    return () => {
      const currentSnippets = state.sqlSnippets
      const remainingSnippets = currentSnippets?.filter(
        (snippet) => !isSameSnippet(snippet, currentQuery)
      )

      if (currentSnippets && remainingSnippets?.length !== currentSnippets.length) {
        state.setSqlSnippets(remainingSnippets ?? [])
      }
    }
  }, [shortcutsEnabled, isInSQLEditor, snippetContent, openSnippetSource, state])

  if (!snap.activeChatId) return null

  return (
    <AssistantChat
      chatId={snap.activeChatId}
      className={className}
      shortcutsEnabled={shortcutsEnabled}
      onNewChat={handleNewChat}
      onSelectChat={(chatId) => state.selectChat(chatId)}
      onBranchChat={(messageId) => state.branchChat(messageId)}
      composerContext={{
        initialInput: snap.initialInput,
        sqlSnippets: snap.sqlSnippets as SqlSnippet[] | undefined,
        suggestions: snap.suggestions
          ? {
              title: snap.suggestions.title,
              prompts: snap.suggestions.prompts?.map((prompt) => ({ ...prompt })),
            }
          : undefined,
        onSetSqlSnippets: state.setSqlSnippets,
        onClearSqlSnippets: state.clearSqlSnippets,
      }}
      renderHeader={(props) => (
        <AIAssistantHeader
          {...props}
          shortcutsEnabled={shortcutsEnabled}
          onNewChat={handleNewChat}
          onCloseAssistant={() => closeSidebar(SIDEBAR_KEYS.AI_ASSISTANT)}
        />
      )}
    />
  )
}

export { SupportAssistantSuccessCardContent } from './SupportAssistantSuccessCardContent'
