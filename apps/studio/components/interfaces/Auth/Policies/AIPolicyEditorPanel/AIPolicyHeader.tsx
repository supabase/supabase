import { PostgresPolicy } from '@supabase/postgres-meta'
import styles from '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import clsx from 'clsx'
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react'
import {
  Button,
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
          {assistantVisible ? 'Hide' : 'Show'} AI chat assistant
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
      {/* <Button
        aria-expanded={assistantVisible}
        aria-controls="ai-chat-assistant"
        size="tiny"
        type="outline"
        className={cn(
          'group rounded-r-none border-r-0',
          styles['ai-icon__container--allow-hover-effect'],
          'pl-2 pr-1.5 py-0.5'
        )}
        rounded
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width=""
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="rotate-180 scale-75 opacity-75"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M15 3v18" />
            <path d="m10 15-3-3 3-3" />
          </svg>
        }
        onClick={() => setAssistantVisible(!assistantVisible)}
      /> */}
    </SheetHeader_Shadcn_>
  )
}
