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
    <div className="rounded-md p-0 bg-popover border border-foreground/20 focus-within:border-foreground/30 shadow-xl text-sm max-w-xl">
      <Input
        inputRef={inputRef}
        size="xlarge"
        inputClassName="bg-transparent border-none shadow-none gap-4 text-xs focus-visible:outline-none focus-visible:ring-0 py-2 pl-3"
        placeholder="Ask the Assistant to do something"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={isLoading}
        actions={
          <div className="flex items-center space-x-1 mr-3">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {os === 'macos' ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 5H7.76472L16.2353 19H21M16.2353 5H21"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <p className="text-xs text-scale-1100">ALT</p>
                )}
                <ArrowDownLeft size={16} strokeWidth={1.5} />
              </>
            )}
          </div>
        }
      />
      {isDiffVisible && (
        <div className="flex justify-start gap-2 pb-1 px-3 -mt-1">
          <Button onClick={onAccept} className="text-xs h-auto py-0 px-3" disabled={isLoading}>
            Accept
          </Button>
          <Button
            onClick={onReject}
            type="outline"
            className="text-xs h-auto py-0 px-3"
            disabled={isLoading}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}
