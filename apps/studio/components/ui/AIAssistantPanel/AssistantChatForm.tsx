'use client'

import { useBreakpoint } from 'common'
import { ArrowUp, Loader2 } from 'lucide-react'
import React, { ChangeEvent, memo, useRef } from 'react'
import { Button, ExpandingTextArea } from 'ui'
import { cn } from 'ui/src/lib/utils'
import { SnippetRow, getSnippetContent } from './SnippetRow'
import { type SqlSnippet } from './AIAssistant.types'

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
}

const AssistantChatFormComponent = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      loading = false,
      disabled = false,
      value = '',
      textAreaRef,
      onValueChange,
      onSubmit,
      placeholder,
      sqlSnippets,
      onRemoveSnippet,
      snippetsClassName,
      includeSnippetsInMessage = false,
      className,
      ...props
    },
    ref
  ) => {
    const formRef = useRef<HTMLFormElement>(null)
    const isMobile = useBreakpoint('md')

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) event.preventDefault()
      if (!value || loading) return

      let finalMessage = value
      if (includeSnippetsInMessage && sqlSnippets && sqlSnippets.length > 0) {
        const sqlSnippetsString = sqlSnippets
          .map((snippet: SqlSnippet) => '```sql\n' + getSnippetContent(snippet) + '\n```')
          .join('\n')
        finalMessage = [value, sqlSnippetsString].filter(Boolean).join('\n\n')
      }

      onSubmit(finalMessage)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          className={cn('relative overflow-hidden', className)}
        >
          {sqlSnippets && sqlSnippets.length > 0 && (
            <SnippetRow
              snippets={sqlSnippets}
              onRemoveSnippet={onRemoveSnippet}
              className="absolute top-0 left-0 right-0 px-1.5 py-1.5"
            />
          )}
          <ExpandingTextArea
            ref={textAreaRef}
            autoFocus={isMobile}
            disabled={disabled}
            className={cn(
              'text-sm pr-10 max-h-64',
              sqlSnippets && sqlSnippets.length > 0 && 'pt-10'
            )}
            placeholder={placeholder}
            spellCheck={false}
            rows={3}
            value={value}
            onChange={(event) => onValueChange(event)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-1.5 bottom-1.5 flex gap-3 items-center">
            {loading && (
              <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
            )}
            <Button
              htmlType="submit"
              aria-label="Send message"
              icon={<ArrowUp />}
              disabled={!canSubmit}
              className={cn(
                'w-7 h-7 rounded-full p-0 text-center flex items-center justify-center',
                !canSubmit ? 'opacity-50' : 'opacity-100',
                loading && 'hidden'
              )}
            />
          </div>
        </form>
      </div>
    )
  }
)

AssistantChatFormComponent.displayName = 'AssistantChatFormComponent'

export const AssistantChatForm = memo(AssistantChatFormComponent)
