'use client'

import { Button, cn, KeyboardShortcut, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ASK_AI_SHORTCUT_KEY } from './constants'
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
          aria-keyshortcuts={`Meta+${ASK_AI_SHORTCUT_KEY} Control+${ASK_AI_SHORTCUT_KEY}`}
          onClick={handleClick}
          className={cn('h-[30px]', className)}
        >
          Ask AI
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <KeyboardShortcut keys={['Meta', ASK_AI_SHORTCUT_KEY]} variant="keycaps" />
      </TooltipContent>
    </Tooltip>
  )
}
