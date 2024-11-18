import { uuidv4 } from 'lib/helpers'
import { useState, useEffect } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'
import type { Message as MessageType } from 'ai/react'

export const AiAssistantPanel = () => {
  const { aiAssistantPanel, resetAiAssistantPanel } = useAppStateSnapshot()
  const [initialMessages, setInitialMessages] = useState<MessageType[] | undefined>(undefined)

  useEffect(() => {
    // set initial state of local messages to the global state if it exists
    if (aiAssistantPanel.messages) {
      const messagesCopy = aiAssistantPanel.messages.map((msg) => ({
        content: msg.content,
        createdAt: msg.createdAt,
        role: msg.role,
        id: msg.id,
      }))
      setInitialMessages(messagesCopy)
    }
  }, [])

  const { open } = aiAssistantPanel
  const [chatId, setChatId] = useState(() => uuidv4())

  const handleReset = () => {
    // reset local and global state
    setChatId(uuidv4())
    setInitialMessages(undefined)
    resetAiAssistantPanel()
  }

  return !open ? null : (
    <AIAssistant
      initialMessages={initialMessages}
      id={chatId}
      className={cn('w-full h-full')}
      onResetConversation={handleReset}
    />
  )
}
