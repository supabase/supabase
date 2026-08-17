import { useParams } from 'common'
import { Loader2, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent } from 'react'
import { Button } from 'ui'

import { ExplorerChatToolbar } from './ExplorerChatToolbar'
import { useCreateChat } from './hooks'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AssistantChat } from '@/components/ui/AIAssistantPanel/AssistantChat'
import { useAiAssistantState, useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const ChatEditor = () => {
  const { id, ref } = useParams()
  const router = useRouter()
  const tabs = useTabsStateSnapshot()
  const aiAssistant = useAiAssistantStateSnapshot()
  const aiAssistantState = useAiAssistantState()
  const { createChat, openChat } = useCreateChat()
  const { activeSidebar } = useSidebarManagerSnapshot()
  const chat = id ? aiAssistant.chats[id] : undefined
  const chatInstance = id ? aiAssistant.chatInstances[id] : undefined
  const tabId = id ? createTabId('chat', { id }) : undefined
  const shortcutsEnabled = activeSidebar?.id !== SIDEBAR_KEYS.AI_ASSISTANT

  const syncChatTab = useEffectEvent(() => {
    if (!id || !chat) return

    aiAssistantState.ensureChatInstance(id)
    const nextTabId = createTabId('chat', { id })
    tabs.addTab({
      id: nextTabId,
      type: 'chat',
      label: chat.name,
      metadata: { chatId: id },
      isPreview: false,
    })
    tabs.updateTab(nextTabId, { label: chat.name })
  })

  const removeDeletedChatTab = useEffectEvent(() => {
    if (!tabId || !tabs.openTabs.includes(tabId)) return

    tabs.handleTabClose({
      id: tabId,
      router,
      editor: 'explorer',
      onClearDashboardHistory: () => {},
    })
  })

  useEffect(() => syncChatTab(), [id, chat?.name])

  useEffect(() => {
    if (aiAssistant.isInitialized && id && !chat) removeDeletedChatTab()
  }, [aiAssistant.isInitialized, id, chat])

  if (!aiAssistant.isInitialized || (chat && !chatInstance)) {
    return (
      <div className="h-full bg-surface-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (!id || !chat) {
    return (
      <div className="h-full bg-surface-100 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <MessageSquare className="text-foreground-muted" />
        <div>
          <h2 className="text-sm text-foreground">Chat not found</h2>
          <p className="text-sm text-foreground-lighter">
            This chat may have been deleted or is no longer available.
          </p>
        </div>
        <Button variant="default" onClick={() => router.push(`/project/${ref}/explorer`)}>
          Back to Explorer
        </Button>
      </div>
    )
  }

  const handleBranchChat = (messageId: string) => {
    const branchId = aiAssistantState.createBranch(id, messageId)
    if (branchId) openChat(branchId)
  }

  return (
    <AssistantChat
      chatId={id}
      shortcutsEnabled={shortcutsEnabled}
      className="bg-surface-100"
      onNewChat={() => createChat()}
      onSelectChat={openChat}
      onBranchChat={handleBranchChat}
      renderHeader={(headerProps) => (
        <ExplorerChatToolbar {...headerProps} chatId={id} shortcutsEnabled={shortcutsEnabled} />
      )}
    />
  )
}
