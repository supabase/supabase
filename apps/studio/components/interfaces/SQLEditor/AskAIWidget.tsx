import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef } from 'react'

import { Button, ExpandingTextArea } from 'ui'

interface AskAIWidgetProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (prompt: string) => void
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  isDiffVisible: boolean
  isLoading?: boolean
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
}: AskAIWidgetProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => {
      textAreaRef.current?.focus()
      textAreaRef.current?.setSelectionRange(value.length, value.length)
    }, 100)
  }, [])

  const handleSubmit = useCallback(() => {
    if (value.trim() && !isLoading) {
      onSubmit(value)
    }
  }, [value, isLoading, onSubmit])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="overflow-hidden rounded-md p-0 bg-popover border border-foreground/20 focus-within:border-foreground/30 shadow-xl text-sm max-w-xl">
      <ExpandingTextArea
        ref={textAreaRef}
        className="bg-transparent border-0 outline-0 ring-0 ring-offset-0 focus:outline-0 focus:ring-0 focus:ring-offset-0 focus-visible:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-within:outline-0 focus-within:ring-0 focus-within:ring-offset-0 shadow-none rounded-none gap-4 text-xs md:text-xs py-2 pl-3 !leading-[20px]"
        placeholder={isDiffVisible ? 'Make an edit...' : 'Edit via the Assistant...'}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
