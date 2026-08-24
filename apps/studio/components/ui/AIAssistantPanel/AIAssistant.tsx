import type { UIMessage as MessageType } from '@ai-sdk/react'
import { useParams } from 'common/hooks'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent } from 'react'

import { AIAssistantHeader } from './AIAssistantHeader'
import { AssistantChat } from './AssistantChat'
import { resolveSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
import {
  ASSISTANT_HANDOFF_QUERY_PARAM,
  buildSupportAssistantPrompt,
  decodeAssistantHandoff,
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
  const { id: entityId, source: sourceParam } = useParams()
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

  const processAssistantHandoff = useEffectEvent((handoffParam: string) => {
    const request = decodeAssistantHandoff(handoffParam)
    if (!request) return

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

    const { [ASSISTANT_HANDOFF_QUERY_PARAM]: _handledParam, ...restQuery } = router.query
    router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
  })

  // Picks up a support chat handed off from an org-level support page. Waits for
  // `isInitialized` since the assistant state's IndexedDB restore overwrites
  // `state.chats`/`activeChatId` wholesale once it resolves, which would wipe out a chat
  // created here if this ran first.
  useEffect(() => {
    if (!snap.isInitialized) return

    const handoffParam = router.query[ASSISTANT_HANDOFF_QUERY_PARAM]
    if (typeof handoffParam !== 'string') return

    processAssistantHandoff(handoffParam)
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
