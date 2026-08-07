import { ArrowUp, Check, ChevronDown, CirclePlus, Sparkles } from 'lucide-react'
import { FormEvent, KeyboardEvent, useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ExpandingTextArea,
} from 'ui'

const CHAT_MODELS = ['gpt-5.4-nano', 'gpt-5.3-codex'] as const

interface ChatComposerProps {
  onSubmit: (message: string) => void
  className?: string
  placeholder?: string
  ariaLabel?: string
  submitLabel?: string
}

/** Shared Home and Chat composer — model choice stays local until transport exists. */
export const ChatComposer = ({
  onSubmit,
  className,
  placeholder = 'Ask anything about your project',
  ariaLabel = 'Message the Assistant',
  submitLabel = 'Send message',
}: ChatComposerProps) => {
  const [draft, setDraft] = useState('')
  const [selectedModel, setSelectedModel] = useState<(typeof CHAT_MODELS)[number]>(CHAT_MODELS[0])

  const sendDraft = () => {
    const message = draft.trim()
    if (message.length === 0) return
    onSubmit(message)
    setDraft('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendDraft()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendDraft()
    }
  }

  return (
    <form className={cn('relative mx-auto w-full max-w-3xl', className)} onSubmit={handleSubmit}>
      <ExpandingTextArea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-h-24 max-h-48 rounded-xl bg-surface-100 px-4 pb-10 pt-3 text-sm"
      />
      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between">
        <div className="pointer-events-auto flex items-center gap-1">
          <Button
            type="button"
            variant="text"
            size="tiny"
            className="w-7 px-0"
            aria-label="Add context"
            icon={<CirclePlus size={15} />}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="text"
                size="tiny"
                className="gap-1 px-1.5 text-foreground-light"
                aria-label="Select model"
                iconRight={<ChevronDown size={13} />}
              >
                {selectedModel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-48">
              {CHAT_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model}
                  className="gap-x-2"
                  onSelect={() => setSelectedModel(model)}
                >
                  <Sparkles size={14} strokeWidth={1.5} />
                  {model}
                  {selectedModel === model && <Check className="ml-auto" size={14} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          type="button"
          variant="default"
          size="tiny"
          className="pointer-events-auto size-7 rounded-full px-0"
          aria-label={submitLabel}
          disabled={draft.trim().length === 0}
          icon={<ArrowUp size={15} />}
          onClick={sendDraft}
        />
      </div>
    </form>
  )
}
