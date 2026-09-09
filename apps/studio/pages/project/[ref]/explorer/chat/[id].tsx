import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerChatTab } from '@/components/interfaces/Explorer/ExplorerChatTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const ChatPage: NextPageWithLayout = () => {
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

ChatPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ChatPage
