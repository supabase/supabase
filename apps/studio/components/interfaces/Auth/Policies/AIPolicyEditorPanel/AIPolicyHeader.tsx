import type { PostgresPolicy } from '@supabase/postgres-meta'
import clsx from 'clsx'
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react'
import {
  SheetClose_Shadcn_,
  SheetHeader_Shadcn_,
  SheetTitle_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

export const AIPolicyHeader = ({
  selectedPolicy,
  assistantVisible,
  setAssistantVisible,
}: {
  selectedPolicy?: PostgresPolicy
  assistantVisible: boolean
  setAssistantVisible: (v: boolean) => void
}) => {
  return (
    <SheetHeader_Shadcn_
      className={cn(
        selectedPolicy !== undefined ? 'pt-3 pb-0' : 'py-3',
        'flex flex-row justify-between items-center'
      )}
    >
      <div className="flex flex-row gap-3 items-center max-w-[75%]">
        <SheetClose_Shadcn_
          className={clsx(
            'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none data-[state=open]:bg-secondary',
            'transition'
          )}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close</span>
        </SheetClose_Shadcn_>
        <div className="h-[24px] w-[1px] bg-border-overlay" />
        <SheetTitle_Shadcn_ className="truncate">
          {selectedPolicy !== undefined
            ? `Update policy: ${selectedPolicy.name}`
            : 'Create a new Row Level Security policy'}
        </SheetTitle_Shadcn_>
      </div>
      <Tooltip_Shadcn_>
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
      </Tooltip_Shadcn_>
    </SheetHeader_Shadcn_>
  )
}
