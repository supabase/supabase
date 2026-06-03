import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import DefaultLayout from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'
import { AIAssistant } from '@/components/ui/AIAssistantPanel/AIAssistant'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const SqlEditorChatPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, chatId } = useParams()
  const assistant = useAiAssistantStateSnapshot()
  const tabs = useTabsStateSnapshot()

  const chat = chatId ? assistant.chats[chatId] : undefined
  const tabId = chatId ? createTabId('chat', { id: chatId }) : undefined

  const navigateToChat = useCallback(
    (nextChatId: string) => {
      if (!ref) return
      router.push(`/project/${ref}/sql/chats/${nextChatId}`)
    },
    [ref, router]
  )

  const handleChatDeleted = useCallback(
    (deletedChatId: string, nextChatId?: string) => {
      tabs.removeTab(createTabId('chat', { id: deletedChatId }))

      if (deletedChatId !== chatId || !ref) return

      if (nextChatId) {
        router.push(`/project/${ref}/sql/chats/${nextChatId}`)
      } else {
        router.push(`/project/${ref}/sql`)
      }
    },
    [chatId, ref, router, tabs]
  )

  useEffect(() => {
    if (!router.isReady || !assistant.isInitialized || !chatId || !chat || !tabId) return

    if (assistant.activeChatId !== chatId) {
      assistant.selectChat(chatId)
    }

    if (tabs.tabsMap[tabId]?.label !== chat.name) {
      tabs.updateTab(tabId, { label: chat.name })
    }

    tabs.addTab({
      id: tabId,
      type: 'chat',
      label: chat.name,
      metadata: {
        chatId,
        name: chat.name,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    router.isReady,
    assistant.isInitialized,
    assistant.activeChatId,
    chatId,
    chat?.id,
    chat?.name,
    tabId,
  ])

  if (!assistant.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-foreground-light text-sm">Loading chat...</span>
      </div>
    )
  }

  if (!chat || !chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-[400px]">
          <Admonition
            type="default"
            title={`Unable to find chat with ID ${chatId}`}
            description="This chat doesn't exist in your project"
          >
            <Button
              type="default"
              className="mt-2"
              onClick={() => {
                if (tabId) tabs.removeTab(tabId)
                router.push(`/project/${ref}/sql`)
              }}
            >
              Head back
            </Button>
          </Admonition>
        </div>
      </div>
    )
  }

  if (assistant.activeChatId !== chatId) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-foreground-light text-sm">Loading chat...</span>
      </div>
    )
  }

  return (
    <AIAssistant
      className="bg-studio h-full min-h-0"
      conversationClassName="min-h-0"
      conversationContentClassName={`
        px-4 md:px-8
        [&_.assistant-message-container-standard]:mx-auto
        [&_.assistant-message-container-standard]:max-w-3xl
        [&_.assistant-message-container-query]:mx-auto
        [&_.assistant-message-container-query]:max-w-6xl
        [&_.assistant-message-container-query_.assistant-message-actions]:mx-auto
        [&_.assistant-message-container-query_.assistant-message-actions]:max-w-3xl
        [&_.assistant-message-part-standard]:mx-auto
        [&_.assistant-message-part-standard]:max-w-3xl
        [&_.assistant-message-part-query]:mx-auto
        [&_.assistant-message-part-query]:max-w-6xl
      `}
      composerClassName="mx-auto w-full max-w-3xl"
      showHeader={false}
      showCloseButton={false}
      onChatSelected={navigateToChat}
      onChatCreated={navigateToChat}
      onChatDeleted={handleChatDeleted}
    />
  )
}

SqlEditorChatPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />}>
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlEditorChatPage
