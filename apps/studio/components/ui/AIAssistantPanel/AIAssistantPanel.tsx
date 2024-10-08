import { useState } from 'react'

import { useChat } from 'ai/react'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { cn, Sheet, SheetContent, SheetHeader } from 'ui'
import { AIAssistant } from './AIAssistant'

// [Joshen] Idea is that this is sort of a universal assistant
// It can house different editors (like the table editor's SideEditorPanel)
// It can also be just the assistant standalone
// Trying to see what's the best way to build this for now
// AI assistant is always the left most pane, so that its toggleable with minimal UI shifting

// Perhaps end goal: we try to shift RLS assistant (and SQL editor assistant?) here maybe

export const AiAssistantPanel = () => {
  const [chatId, setChatId] = useState(uuidv4())

  const isOptedInToAI = useOrgOptedIntoAi()
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel

  const {
    messages: chatMessages,
    append,
    isLoading,
  } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/suggest`,
    body: {
      entityDefinitions: isOptedInToAI || !IS_PLATFORM ? undefined : undefined,
    },
  })

  return (
    <Sheet open={open} onOpenChange={() => setAiAssistantPanel({ open: !open, editor: undefined })}>
      <SheetContent showClose className={cn('flex gap-0 w-[900px]')}>
        {/* Assistant */}
        <AIAssistant
          className="border-r"
          isLoading={isLoading}
          onSubmit={(message) =>
            append({
              content: message,
              role: 'user',
              createdAt: new Date(),
            })
          }
        />

        {/* Editor */}
        <div className={cn('w-1/2')}>
          <SheetHeader className="flex items-center gap-x-2 py-3">Editor: {editor}</SheetHeader>
        </div>
      </SheetContent>
    </Sheet>
  )
}
