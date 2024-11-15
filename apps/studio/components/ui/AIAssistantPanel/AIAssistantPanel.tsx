import { uuidv4 } from 'lib/helpers'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

// [Joshen] Depending on how the Assistant will be like - we can probably deprecate this file
// and just use AIAssistant directly instead

export const AiAssistantPanel = () => {
  const { aiAssistantPanel, resetAiAssistantPanel } = useAppStateSnapshot()

  const { open } = aiAssistantPanel
  const [chatId, setChatId] = useState(() => uuidv4())

  const handleReset = () => {
    setChatId(uuidv4())
    resetAiAssistantPanel()
  }

  return !open ? null : (
    <AIAssistant id={chatId} className={cn('w-full h-full')} onResetConversation={handleReset} />
  )
}
