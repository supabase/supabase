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
  const showEditor = false

  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel

  return (
    <Sheet open={open} onOpenChange={() => setAiAssistantPanel({ open: !open, editor: undefined })}>
      <SheetContent showClose className={cn('flex gap-0', showEditor ? 'w-[1000px]' : 'w-[500px]')}>
        {/* Assistant */}
        <AIAssistant className={showEditor ? 'border-r w-1/2' : 'w-full'} showEditor={showEditor} />

        {/* Editor */}
        {showEditor && (
          <div className={cn('w-1/2')}>
            <SheetHeader className="flex items-center gap-x-2 py-3">Editor: {editor}</SheetHeader>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
