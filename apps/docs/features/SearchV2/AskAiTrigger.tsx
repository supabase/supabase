'use client'

import { Button, cn } from 'ui'

import { useSearchV2 } from './SearchV2Provider'

interface AskAiTriggerProps {
  className?: string
}

export function AskAiTrigger({ className }: AskAiTriggerProps) {
  const { isAskAiOpen, showAskAi } = useSearchV2()

  const handleClick = () => showAskAi({ triggerType: 'ask_ai_button' })

  return (
    <Button
      aria-haspopup="dialog"
      aria-expanded={isAskAiOpen}
      onClick={handleClick}
      className={cn('h-[30px]', className)}
    >
      Ask AI
    </Button>
  )
}
