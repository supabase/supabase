import { useBreakpoint } from 'common'
import { ArrowUp, Loader2, Square } from 'lucide-react'
import { ChangeEvent, FormEvent, forwardRef, KeyboardEvent, memo, useRef } from 'react'
import { ExpandingTextArea } from 'ui'
import { cn } from 'ui/src/lib/utils'

import { ButtonTooltip } from '../ButtonTooltip'
import { type SqlSnippet } from './AIAssistant.types'
import { ModelSelector } from './ModelSelector'
import { getSnippetContent, SnippetRow } from './SnippetRow'

export interface FormProps {
  /* The ref for the textarea, optional. Exposed for the CommandsPopover to attach events. */
  textAreaRef?: React.RefObject<HTMLTextAreaElement>
  /* The loading state of the form */
  loading: boolean
  /* The disabled state of the form */
  disabled?: boolean
  /* The value of the textarea */
  value?: string
  /* The function to handle the value change */
  onValueChange: (value: ChangeEvent<HTMLTextAreaElement>) => void
  /**
   * If true, include SQL snippets in the message sent to onSubmit
   */
  includeSnippetsInMessage?: boolean
  /**
   * The function to handle the form submission
   */
  onSubmit: (message: string) => void
  /**
   * The function to handle stopping the stream
   */
  onStop?: () => void
  /* The placeholder of the textarea */
  placeholder?: string
  /* SQL snippets to display above the form - can be strings or objects with label and content */
  sqlSnippets?: SqlSnippet[]
  /* Function to handle removing a SQL snippet */
  onRemoveSnippet?: (index: number) => void
  /* Additional class name for the snippets container */
  snippetsClassName?: string
  /* Additional class name for the form wrapper */
  className?: string
  /* If currently editing an existing message */
  isEditing?: boolean
  /* The currently selected AI model */
  selectedModel: 'gpt-5' | 'gpt-5-mini'
  /* Callback when a model is chosen */
  onSelectModel: (model: 'gpt-5' | 'gpt-5-mini') => void
}

const AssistantChatFormComponent = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      loading = false,
      disabled = false,
      value = '',
      textAreaRef,
      onValueChange,
      onSubmit,
      onStop,
      placeholder,
      sqlSnippets,
      onRemoveSnippet,
      snippetsClassName,
      includeSnippetsInMessage = false,
      className,
      isEditing = false,
      selectedModel,
      onSelectModel,
      ...props
    },
    ref
  ) => {
    const formRef = useRef<HTMLFormElement>(null)
    const isMobile = useBreakpoint('md')

    const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
      if (event) event.preventDefault()
      if (!value || (loading && !isEditing)) return

      let finalMessage = value
      if (includeSnippetsInMessage && sqlSnippets && sqlSnippets.length > 0) {
        const sqlSnippetsString = sqlSnippets
          .map((snippet: SqlSnippet) => '```sql\n' + getSnippetContent(snippet) + '\n```')
          .join('\n')
        finalMessage = [value, sqlSnippetsString].filter(Boolean).join('\n\n')
      }

      onSubmit(finalMessage)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSubmit()
      }
    }

    const canSubmit = !loading && !!value

    return (
      <div className="w-full">
        <form
          id="assistant-chat"
          ref={formRef}
          {...props}
          onSubmit={handleSubmit}
          className={cn('relative', className)}
        >
          {sqlSnippets && sqlSnippets.length > 0 && (
            <SnippetRow
              snippets={sqlSnippets}
              onRemoveSnippet={onRemoveSnippet}
              className="absolute top-0 left-0 right-0 px-1.5 py-1.5"
            />
          )}
          <ExpandingTextArea
            autoFocus={!isMobile}
            ref={textAreaRef}
            disabled={disabled}
            className={cn(
              'text-base md:text-sm pr-10 pb-9 max-h-64',
              sqlSnippets && sqlSnippets.length > 0 && 'pt-10'
            )}
            placeholder={placeholder}
            spellCheck={false}
            rows={3}
            value={value}
            onChange={(event) => onValueChange(event)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
            </div>

            <div className="flex gap-3 items-center pointer-events-auto">
              {loading ? (
                onStop ? (
                  <ButtonTooltip
                    type="outline"
                    aria-label="Stop response"
                    icon={<Square fill="currentColor" className="scale-75" />}
                    onClick={onStop}
                    className="w-7 h-7 rounded-full p-0 text-center flex items-center justify-center"
                    tooltip={{ content: { side: 'top', text: 'Stop response' } }}
                  />
                ) : (
                  <Loader2 size={22} className="animate-spin size-7 text-muted" strokeWidth={1} />
                )
              ) : (
                <ButtonTooltip
                  htmlType="submit"
                  aria-label="Send message"
                  icon={<ArrowUp />}
                  disabled={!canSubmit}
                  className={cn(
                    'w-7 h-7 rounded-full p-0 text-center flex items-center justify-center',
                    !canSubmit ? 'opacity-50' : 'opacity-100'
                  )}
                  tooltip={{ content: { side: 'top', text: 'Send message' } }}
                />
              )}
            </div>
          </div>
        </form>
      </div>
    )
  }
)

AssistantChatFormComponent.displayName = 'AssistantChatFormComponent'

export const AssistantChatForm = memo(AssistantChatFormComponent)
