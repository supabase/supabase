import type { Message as MessageType } from 'ai/react'
import { uuidv4 } from 'lib/helpers'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAssistant } from 'hooks/useAssistant'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

export const AIAssistantPanel = () => {
  const router = useRouter()
  const projectRef = typeof router.query.ref === 'string' ? router.query.ref : undefined
  const { isOpen, messages, chats, projectChats, activeChatId, newChat, selectChat } = useAssistant(
    { projectRef }
  )

  // Use useMemo for the initial state to prevent unnecessary re-renders
  const initialMessagesValue = useMemo(
    () => (messages?.length > 0 ? JSON.parse(JSON.stringify(messages)) : undefined),
    []
  ) // Empty dependency array means this only runs once on mount

  const [initialMessages, setInitialMessages] = useState<MessageType[] | undefined>(
    initialMessagesValue
  )
  const [chatId, setChatId] = useState(() => uuidv4())

  // Create a new chat if there are no project chats and the panel is open
  useEffect(() => {
    if (isOpen && Object.keys(projectChats).length === 0 && projectRef) {
      const newChatId = newChat()
      if (newChatId) setChatId(newChatId)
    }
  }, [isOpen, projectChats, projectRef, newChat])

  // Update the chat ID when the active chat changes
  useEffect(() => {
    if (activeChatId && chats && chats[activeChatId]) {
      // Only set the active chat if it belongs to the current project
      if (chats[activeChatId].projectRef === projectRef) {
        setChatId(activeChatId)
        const activeMessages = chats[activeChatId]?.messages

        // Only update initialMessages if they've actually changed
        if (activeMessages?.length) {
          // Check if messages have changed before updating state
          const currentMessagesJson = JSON.stringify(initialMessages || [])
          const newMessagesJson = JSON.stringify(activeMessages)

          if (currentMessagesJson !== newMessagesJson) {
            // Deep clone to avoid readonly issues
            setInitialMessages(JSON.parse(JSON.stringify(activeMessages)))
          }
        } else if (initialMessages !== undefined && initialMessages.length > 0) {
          // Only set to empty if currently not empty
          setInitialMessages([])
        }
      } else if (Object.keys(projectChats).length > 0) {
        // If active chat is from another project, switch to the first chat of the current project
        const firstProjectChatId = Object.keys(projectChats)[0]
        selectChat(firstProjectChatId)
      }
    }
  }, [activeChatId, chats, projectRef, projectChats, selectChat, initialMessages])

  // Memoize the AIAssistant component to prevent unnecessary re-renders
  const memoizedAssistant = useMemo(() => {
    if (!isOpen) return null

    return (
      <div className="w-full h-[100dvh] md:h-full max-h-[100dvh]">
        <AIAssistant
          initialMessages={initialMessages}
          id={chatId}
          className={cn('w-full h-[100dvh] md:h-full max-h-[100dvh]')}
        />
      </div>
    )
  }, [isOpen, initialMessages, chatId])

  return memoizedAssistant
}
