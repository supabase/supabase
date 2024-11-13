import { useRef, useState } from 'react'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { uuidv4 } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

export const AiAssistantPanel = () => {
  const { aiAssistantPanel } = useAppStateSnapshot()

  const { open, initialMessages, initialInput, sqlSnippets } = aiAssistantPanel

  const [chatId, setChatId] = useState(() => uuidv4())

  return !open ? null : (
    <AIAssistant
      id={chatId}
      initialMessages={initialMessages}
      sqlSnippets={sqlSnippets}
      initialInput={initialInput}
      className={cn('w-full h-full')}
      onResetConversation={() => setChatId(uuidv4())}
    />
  )
}
