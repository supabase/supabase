import { detectOS } from 'lib/helpers'
import { ArrowDownLeft, Loader2, Wand } from 'lucide-react'
import { useCallback } from 'react'
import { Input, Button } from 'ui'

interface AskAIWidgetProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (prompt: string) => void
  onAccept?: () => void
  onReject?: () => void
  isDiffVisible: boolean
  isLoading?: boolean
}

export const AskAIWidget = ({
  value,
  onChange,
  onSubmit,
  onAccept,
  onReject,
  isDiffVisible,
  isLoading = false,
}: AskAIWidgetProps) => {
  const os = detectOS()

  // Auto focus input
  const inputRef = useCallback((input: HTMLInputElement | null) => {
    setTimeout(() => {
      input?.focus()
    }, 0)
  }, [])

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value)
    }
  }

  return (
    <div className="overflow-hidden rounded-md p-0 bg-popover border border-foreground/20 focus-within:border-foreground/30 shadow-xl text-sm max-w-xl">
      <Input
        inputRef={inputRef}
        size="xlarge"
        inputClassName="bg-transparent border-none shadow-none gap-4 text-xs focus-visible:outline-none focus-visible:ring-0 py-2 pl-3"
        placeholder={isDiffVisible ? 'Make an edit...' : 'Edit SQL via the Assistant...'}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
            handleSubmit()
          }
        }}
        disabled={isLoading}
      />
      {isDiffVisible && (
        <div className="flex justify-start p-0 border-t">
          <Button
            type="text"
            onClick={onAccept}
            className="text-xs h-auto py-1 rounded-none px-3 border-r-border"
            disabled={isLoading}
          >
            Accept <span className="text-xs text-foreground-light">⌘ + Enter</span>
          </Button>
          <Button
            onClick={onReject}
            type="text"
            className="text-xs h-auto py-1 rounded-none px-3 border-r-border"
            disabled={isLoading}
          >
            Reject <span className="text-xs text-foreground-light">Esc</span>
          </Button>
        </div>
      )}
    </div>
  )
}
