import type { Message as MessageType } from 'ai/react'
import { uuidv4 } from 'lib/helpers'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

export const AIAssistantPanel = () => {
  const { aiAssistantPanel, resetAiAssistantPanel } = useAppStateSnapshot()
  const [initialMessages, setInitialMessages] = useState<MessageType[] | undefined>(
    aiAssistantPanel.messages?.length > 0 ? (aiAssistantPanel.messages as any) : undefined
  )

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
