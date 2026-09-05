import { useParams } from 'common'
import { MessageSquare } from 'lucide-react'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { cn } from 'ui'

import { ExplorerNavResourceWrapper, rowClassName } from './ExplorerLayout.constants'
import { useCreateChat } from '@/components/interfaces/Explorer/hooks'
import type { ChatSession } from '@/state/ai-assistant-state'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'

const getVisibleChats = (chats: ChatSession[], search: string): ChatSession[] => {
  const normalizedSearch = search.trim().toLowerCase()

  return chats
    .filter((chat) => !chat.supportMetadata?.isSupportChat)
    .filter((chat) => !normalizedSearch || chat.name.toLowerCase().includes(normalizedSearch))
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
}

export const ExplorerNavChats = ({ header }: { header: ReactNode }) => {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { id } = useParams()
  const { openChat } = useCreateChat()
  const chatList = useAiAssistantChatList()

  const chats = getVisibleChats(chatList, search)

  return (
    <ExplorerNavResourceWrapper type="chat" header={header} search={search} setSearch={setSearch}>
      <div className="flex flex-1 flex-col gap-px overflow-y-auto px-4 pb-3">
        {chats.length === 0 ? (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No chats found' : 'No chats created yet'}
          </p>
        ) : (
          chats.map((chat) => {
            const isActive = router.pathname.includes('/explorer/chat/') && id === chat.id

            return (
              <button
                key={chat.id}
                type="button"
                tabIndex={0}
                className={rowClassName(isActive)}
                onClick={() => openChat(chat.id)}
              >
                <MessageSquare
                  size={14}
                  className={cn('shrink-0', isActive && 'text-foreground')}
                />
                <span className="truncate text-left">{chat.name}</span>
              </button>
            )
          })
        )}
      </div>
    </ExplorerNavResourceWrapper>
  )
}
