import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerChatTab } from '@/components/interfaces/Explorer/ExplorerChatTab'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/explorer/chat/$id')({
  component: ChatPage,
})

function ChatPage() {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()
  const aiAssistant = useAiAssistantStateSnapshot()
  const chat = id ? aiAssistant.chats[id] : undefined

  const registerTab = useEffectEvent(() => {
    if (!id || !chat) return

    const nextTabId = createTabId('chat', { id })
    tabs.addTab({
      id: nextTabId,
      type: 'chat',
      label: chat.name,
      metadata: { chatId: id },
      isPreview: true,
    })
    tabs.updateTab(nextTabId, { label: chat.name })
  })

  useEffect(() => registerTab(), [id, chat?.name])

  return <ExplorerChatTab />
}
