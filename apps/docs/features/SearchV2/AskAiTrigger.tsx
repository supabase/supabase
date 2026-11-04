'use client'

import { Button, cn, KeyboardShortcut, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useSearchV2 } from './SearchV2Provider'

interface AskAiTriggerProps {
  className?: string
}

export function AskAiTrigger({ className }: AskAiTriggerProps) {
  const { isAskAiOpen, showAskAi } = useSearchV2()

  const handleClick = () => showAskAi({ triggerType: 'ask_ai_button' })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-haspopup="dialog"
          aria-expanded={isAskAiOpen}
          aria-keyshortcuts="Meta+I"
          onClick={handleClick}
          className={cn('h-[30px]', className)}
        >
          Ask AI
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <KeyboardShortcut keys={['Meta', 'i']} variant="keycaps" />
      </TooltipContent>
    </Tooltip>
  )
}
