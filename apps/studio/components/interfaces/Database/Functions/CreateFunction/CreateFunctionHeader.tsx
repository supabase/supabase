import { X } from 'lucide-react'

import { SheetClose, SheetHeader, SheetTitle, cn } from 'ui'

export const CreateFunctionHeader = ({
  selectedFunction,
  assistantVisible,
  setAssistantVisible,
}: {
  selectedFunction?: string
  assistantVisible: boolean
  setAssistantVisible: (v: boolean) => void
}) => {
  return (
    <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
      <div className="flex flex-row gap-3 items-center max-w-[75%]">
        <SheetClose
          className={cn(
            'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none data-[state=open]:bg-secondary',
            'transition'
          )}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close</span>
        </SheetClose>
        <SheetTitle className="truncate">
          {selectedFunction !== undefined
            ? `Edit '${selectedFunction}' function`
            : 'Add a new function'}
        </SheetTitle>
      </div>
      {/* <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <button
            aria-expanded={assistantVisible}
            aria-controls="ai-chat-assistant"
            className={cn(
              !assistantVisible ? 'text-foreground-lighter' : 'text-light',
              'hover:text-foreground',
              'transition'
            )}
            onClick={() => setAssistantVisible(!assistantVisible)}
          >
            {!assistantVisible ? (
              <PanelLeftClose size={19} strokeWidth={1} />
            ) : (
              <PanelRightClose size={19} strokeWidth={1} />
            )}
          </button>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="left">
          {assistantVisible ? 'Hide' : 'Show'} tools
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_> */}
    </SheetHeader>
  )
}
