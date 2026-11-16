import { cn } from 'ui'

interface AskAiIconProps {
  isThinking: boolean
  className?: string
}

export function AskAiIcon({ isThinking, className }: AskAiIconProps) {
  return (
    <span aria-hidden data-thinking={isThinking} className={cn('ask-ai-icon', className)}>
      <span className="ask-ai-icon-groove">
        <span className="ask-ai-icon-foil" />
      </span>
    </span>
  )
}
