import { PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  cn,
  Sheet,
  SheetContent,
  SheetHeader,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { AIAssistant } from './AIAssistant'
import { DatabaseFunctionsEditor } from './Editors/DatabaseFunctionsEditor'

// [Joshen] Idea is that this is sort of a universal assistant
// It can house different editors (like the table editor's SideEditorPanel)
// It can also be just the assistant standalone
// Trying to see what's the best way to build this for now
// AI assistant is always the left most pane, so that its toggleable with minimal UI shifting

// Perhaps end goal: we try to shift RLS assistant (and SQL editor assistant?) here maybe

export const AiAssistantPanel = () => {
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel
  const showEditor = !!editor

  return (
    <Sheet open={open} onOpenChange={() => setAiAssistantPanel({ open: !open, editor: undefined })}>
      <SheetContent
        showClose={true}
        className={cn('flex gap-0', showEditor ? 'w-[1200px]' : 'w-[600px]')}
      >
        {/* Assistant */}
        <AIAssistant className={showEditor ? 'border-r w-1/2' : 'w-full'} />

        {/* Editor */}
        {showEditor && (
          <div className={cn('flex flex-col grow w-1/2')}>
            <SheetHeader className="flex items-center gap-x-3 py-3">
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_>
                  <PanelRightOpen
                    size={16}
                    className="transition text-foreground-light hover:text-foreground cursor-pointer"
                  />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="bottom">Open Assistant</TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
              Editor: {editor}
            </SheetHeader>
            {editor === 'functions' && <DatabaseFunctionsEditor />}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
