import { useRef, useState } from 'react'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { uuidv4 } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AIAssistant } from './AIAssistant'

export const AiAssistantPanel = () => {
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()

  const { open, editor, content, entity, initialMessages, initialInput, sqlSnippets } =
    aiAssistantPanel

  const [chatId, setChatId] = useState(() => uuidv4())

  // [Joshen] JFYI I'm opting to just have the assistant always show and not toggle-able
  // I don't really see any negatives of keeping it open (or benefits from hiding) tbh
  // const [showAssistant, setShowAssistant] = useState(true)
  const editorRef = useRef<IStandaloneCodeEditor | undefined>()

  return !open ? null : (
    <div className="w-[400px] xl:relative xl:top-0 absolute right-0 top-[48px] bottom-0 shrink-0 border-l bg">
      <AIAssistant
        id={chatId}
        initialMessages={initialMessages}
        sqlSnippets={sqlSnippets}
        initialInput={initialInput}
        className={cn('w-full h-full')}
        onResetConversation={() => setChatId(uuidv4())}
      />
    </div>
  )
}
