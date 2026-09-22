import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { ExplorerNavResourceWrapper } from './ExplorerLayout.constants'
import { ExplorerNavItem } from './ExplorerNavItem'
import { useExplorerDeleteItem } from './ExplorerProvider'
import type { ChatSession } from '@/state/ai-assistant-state'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

const getVisibleChats = (chats: ChatSession[], search: string): ChatSession[] => {
  const normalizedSearch = search.trim().toLowerCase()

  return chats
    .filter((chat) => !chat.supportMetadata?.isSupportChat)
    .filter((chat) => !normalizedSearch || chat.name.toLowerCase().includes(normalizedSearch))
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
}

export const ExplorerNavChats = () => {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { id, ref } = useParams()
  const chatList = useAiAssistantChatList()
  const tabs = useTabsStateSnapshot()
  const { onSelectDelete } = useExplorerDeleteItem()

  const chats = getVisibleChats(chatList, search)

  return (
    <ExplorerNavResourceWrapper type="chat" search={search} setSearch={setSearch}>
      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-3">
        {chats.length === 0 ? (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No chats found' : 'No chats created yet'}
          </p>
        ) : (
          chats.map((chat) => {
            const isActive = router.pathname.includes('/explorer/chat/') && id === chat.id

            return (
              <ExplorerNavItem
                type="chat"
                key={chat.id}
                name={chat.name}
                isActive={isActive}
                href={`/project/${ref}/explorer/chat/${chat.id}`}
                onDoubleClick={() => tabs.makeTabPermanent(createTabId('chat', { id: chat.id }))}
                onSelectDelete={() =>
                  onSelectDelete({ id: chat.id, type: 'chat', name: chat.name })
                }
              />
            )
          })
        )}
      </div>
    </ExplorerNavResourceWrapper>
  )
}
