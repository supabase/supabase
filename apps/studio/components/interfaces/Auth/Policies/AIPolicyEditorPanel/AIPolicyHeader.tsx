import { AiIcon, Button, SheetClose_Shadcn_, SheetHeader_Shadcn_, SheetTitle_Shadcn_, cn } from 'ui'

import styles from '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import { X } from 'lucide-react'

export const AIPolicyHeader = ({
  assistantVisible,
  setAssistantVisible,
}: {
  assistantVisible: boolean
  setAssistantVisible: (v: boolean) => void
}) => {
  return (
    <SheetHeader_Shadcn_ className="py-3 flex flex-row justify-between items-center">
      <div className="flex flex-row gap-3 items-center">
        <SheetClose_Shadcn_ className="text-light hover:text ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-3 w-3" />
          <span className="sr-only">Close</span>
        </SheetClose_Shadcn_>
        <div className="h-[24px] w-[1px] bg-border"></div>
        <SheetTitle_Shadcn_>Create a new row level security policy</SheetTitle_Shadcn_>
      </div>
      <Button
        aria-expanded={assistantVisible}
        aria-controls="ai-chat-assistant"
        size="tiny"
        type="outline"
        className={cn('group', styles['ai-icon__container--allow-hover-effect'], 'px-3 py-0.5')}
        rounded
        icon={
          <AiIcon className="scale-75 [&>div>div]:border-foreground-light [&>div>div]:group-hover:border-foreground -mr-0.5" />
        }
        onClick={() => setAssistantVisible(!assistantVisible)}
      >
        {assistantVisible ? <>Close Assistant</> : <>Open Assistant</>}
      </Button>
    </SheetHeader_Shadcn_>
  )
}
