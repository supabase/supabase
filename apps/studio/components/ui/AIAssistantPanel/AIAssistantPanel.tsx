import { uuidv4 } from 'lib/helpers'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

export const AiAssistantPanel = () => {
  const { aiAssistantPanel, resetAiAssistantPanel } = useAppStateSnapshot()
  const [initialMessages, setInitialMessages] = useState(
    aiAssistantPanel.messages?.length > 0 ? aiAssistantPanel.messages : undefined
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
