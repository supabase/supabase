'use client'

import { useRealtimeChat } from '@/registry/default/blocks/realtime-chat/hooks/use-realtime-chat'
import { ChatMessageItem } from './chat-message'
import { useState, useEffect } from 'react'
import useChatScroll from '../hooks/use-chat-scroll'
import { Input } from '@/registry/default/components/ui/input'
import { Button } from '@/registry/default/components/ui/button'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  createdAt: string
}

interface RealtimeChatProps {
  roomName: string
  username: string
  avatar?: string
}

export const RealtimeChat = ({ roomName, username, avatar }: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const { messages, sendMessage, onlineUsers, isConnected } = useRealtimeChat({
    roomName,
    username,
    avatar,
  })
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    sendMessage(newMessage)
    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <Input
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
