import { detectOS } from 'lib/helpers'
import { ArrowDownLeft, Loader2, Wand } from 'lucide-react'
import { useCallback, useRef, useEffect } from 'react'
import { Input, Button, ExpandingTextArea } from 'ui'

interface AskAIWidgetProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (prompt: string) => void
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  isDiffVisible: boolean
  isLoading?: boolean
  onHeightChange?: (height: number) => void
}

export const AskAIWidget = ({
  value,
  onChange,
  onSubmit,
  onAccept,
  onReject,
  onCancel,
  isDiffVisible,
  isLoading = false,
  onHeightChange,
}: AskAIWidgetProps) => {
  const os = detectOS()
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto focus input
  const inputRef = useCallback((input: HTMLTextAreaElement | null) => {
    setTimeout(() => {
      if (input) {
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
      }
    }, 0)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight
        onHeightChange?.(height)
      }
    }

    // Update height on value change
    updateHeight()

    // Set up resize observer to track height changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [value, onHeightChange])

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value)
    }
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-md p-0 bg-popover border border-foreground/20 focus-within:border-foreground/30 shadow-xl text-sm max-w-xl"
    >
      <ExpandingTextArea
        ref={inputRef}
        className="bg-transparent border-0 outline-0 ring-0 ring-offset-0 focus:outline-0 focus:ring-0 focus:ring-offset-0 focus-visible:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-within:outline-0 focus-within:ring-0 focus-within:ring-offset-0 shadow-none rounded-none gap-4 text-xs md:text-xs py-2 pl-3 !leading-[20px]"
        placeholder={isDiffVisible ? 'Make an edit...' : 'Edit via the Assistant...'}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
            handleSubmit()
          }
        }}
        disabled={isLoading}
      />
      {isDiffVisible ? (
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
      ) : (
        <div className="flex justify-start p-0 border-t">
          <Button
            type="text"
            onClick={handleSubmit}
            loading={isLoading}
            className="text-xs h-auto py-1 rounded-none px-3 border-r-border"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}{' '}
            {!isLoading && <span className="text-xs text-foreground-light">Enter</span>}
          </Button>
          <Button
            onClick={onCancel}
            type="text"
            className="text-xs h-auto py-1 rounded-none px-3 border-r-border"
            disabled={isLoading}
          >
            Cancel <span className="text-xs text-foreground-light">Esc</span>
          </Button>
        </div>
      )}
    </div>
  )
}
