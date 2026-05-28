'use client'

import { AiIconAnimation, cn } from 'ui'

interface ContextSuggestionsProps {
  questions: string[]
  onSelect: (question: string) => void
  suggestionKey: string
  label?: string
  compact?: boolean
  className?: string
}

function ContextSuggestions({
  questions,
  onSelect,
  suggestionKey,
  label = 'Examples',
  compact = false,
  className,
}: ContextSuggestionsProps) {
  if (questions.length === 0) return null

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-xs font-mono uppercase tracking-widest text-foreground-muted">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.slice(0, 3).map((question, index) => (
            <button
              key={`${suggestionKey}-${index}`}
              type="button"
              onClick={() => onSelect(question)}
              className={cn(
                'rounded-full border border-default bg-surface-100 px-2.5 py-1',
                'text-left text-xs text-foreground-light transition-colors',
                'hover:border-strong hover:bg-surface-200 hover:text-foreground'
              )}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2 p-4', className)}>
      <p className="text-xs font-mono uppercase tracking-widest text-foreground-muted">{label}</p>
      <ul className="space-y-1">
        {questions.map((question, index) => (
          <li key={`${suggestionKey}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm',
                'text-foreground-light transition-colors hover:bg-surface-100'
              )}
            >
              <AiIconAnimation size={16} className="mt-0.5 shrink-0" />
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ContextSuggestions }
