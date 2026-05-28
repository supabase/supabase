'use client'

import { useCallback, useState } from 'react'
import { Button, cn, Input } from 'ui'
import { SpeechInput } from 'ui-patterns/AgentUi'

const CHAT_INPUT_ACTION_BUTTON_CLASSNAME =
  'size-7 min-h-7 min-w-7 shrink-0 rounded-full !p-0'

interface DocsAiChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
  onListeningChange?: (isListening: boolean) => void
  placeholder: string
  disabled?: boolean
  isImeComposing: boolean
  onCompositionStart: () => void
  onCompositionEnd: () => void
  className?: string
}

function DocsAiChatInput({
  value,
  onChange,
  onSubmit,
  onListeningChange,
  placeholder,
  disabled = false,
  isImeComposing,
  onCompositionStart,
  onCompositionEnd,
  className,
}: DocsAiChatInputProps) {
  const [isListening, setIsListening] = useState(false)

  const handleListeningChange = useCallback(
    (listening: boolean) => {
      setIsListening(listening)
      onListeningChange?.(listening)
    },
    [onListeningChange]
  )

  const handleTranscription = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || disabled) return

      onChange(trimmed)
      onSubmit(trimmed)
    },
    [disabled, onChange, onSubmit]
  )

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!isImeComposing) {
          onSubmit(value)
        }
      }}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full border border-control bg-foreground/[.026] px-[9px] py-1.5',
          'focus-within:border-control focus-within:ring-2 focus-within:ring-background-control focus-within:ring-offset-2 focus-within:ring-offset-foreground-muted',
          disabled && 'opacity-50',
          isListening && 'border-brand-500/40'
        )}
      >
        <SpeechInput
          disabled={disabled}
          buttonClassName={CHAT_INPUT_ACTION_BUTTON_CLASSNAME}
          onListeningChange={handleListeningChange}
          onTranscriptionChange={handleTranscription}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="primary"
          size="tiny"
          htmlType="submit"
          disabled={!value.trim() || disabled}
          className={CHAT_INPUT_ACTION_BUTTON_CLASSNAME}
          aria-label="Send message"
        >
          ↑
        </Button>
      </div>
    </form>
  )
}

export { DocsAiChatInput }
