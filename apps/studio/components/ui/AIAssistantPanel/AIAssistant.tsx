import type { UIMessage as MessageType } from '@ai-sdk/react'
import { useParams } from 'common/hooks'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { AIAssistantHeader } from './AIAssistantHeader'
import { AssistantChat } from './AssistantChat'
import { resolveSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
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

  useEffect(() => {
    if (shortcutsEnabled && isInSQLEditor && !!snippetContent) {
      state.setSqlSnippets([
        { label: 'Current Query', content: snippetContent, source: openSnippetSource },
      ])
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
