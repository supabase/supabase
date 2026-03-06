'use client'

import { useBreakpoint } from 'common'
import { Loader2 } from 'lucide-react'
import React, { ChangeEvent, memo, useRef } from 'react'
import { ExpandingTextArea } from 'ui'
import { cn } from 'ui/src/lib/utils'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
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
  /* Used to stop onSubmit event when Command popover is open. Use with AssistantCommandsPopover */
  commandsOpen?: boolean
  /* Used to close Command popover when onSubmit event happens. Use with AssistantCommandsPopover */
  setCommandsOpen?: (value: boolean) => void
  /* The icon to display on the left of the textarea */
  icon?: React.ReactNode
  /* The function to handle the form submission */
  onSubmit: React.FormHTMLAttributes<HTMLFormElement>['onSubmit']
  /* The placeholder of the textarea */
  placeholder?: string
}

const AssistantChatFormComponent = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      loading = false,
      disabled = false,
      value = '',
      textAreaRef,
      commandsOpen = false,
      icon = null,
      onValueChange,
      setCommandsOpen,
      onSubmit,
      placeholder,
      ...props
    },
    ref
  ) => {
    const formRef = useRef<HTMLFormElement>(null)
    const submitRef = useRef<HTMLButtonElement>(null)
    const isMobile = useBreakpoint('md')

    /**
     * This function is used to handle the "Enter" key press
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Check if the pressed key is "Enter" (key code 13) without the "Shift" key
      // also checks if the commands popover is open
      if (event.key === 'Enter' && event.keyCode === 13 && !event.shiftKey && !commandsOpen) {
        event.preventDefault()
        if (submitRef.current) submitRef.current.click()
      }

      // handles closing the commands popover if open
      if (event.key === 'Enter' && commandsOpen) {
        if (setCommandsOpen) setCommandsOpen(false)
      }
    }

    return (
      <form
        id="assistant-chat"
        ref={formRef}
        {...props}
        onSubmit={onSubmit}
        className={cn('relative ', props.className)}
      >
        <ExpandingTextArea
          ref={textAreaRef}
          autoFocus={isMobile}
          disabled={disabled}
          className="text-base md:text-sm pr-10 rounded max-h-64"
          placeholder={placeholder}
          spellCheck={false}
          rows={3}
          value={value}
          onChange={(event) => onValueChange(event)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-1.5 top-1.5 flex gap-3 items-center">
          {loading && (
            <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
          )}

          <button
            ref={submitRef}
            type="submit"
            className={cn(
              'transition-all',
              'flex items-center justify-center w-7 h-7 border border-control rounded-full mr-0.5 p-1.5 background-alternative',
              !value ? 'text-muted opacity-50' : 'text-default opacity-100',
              loading && 'hidden'
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.5 3V2.25H15V3V10C15 10.5523 14.5522 11 14 11H3.56062L5.53029 12.9697L6.06062 13.5L4.99996 14.5607L4.46963 14.0303L1.39641 10.9571C1.00588 10.5666 1.00588 9.93342 1.39641 9.54289L4.46963 6.46967L4.99996 5.93934L6.06062 7L5.53029 7.53033L3.56062 9.5H13.5V3Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </form>
    )
  }
)

AssistantChatFormComponent.displayName = 'AssistantChatFormComponent'

export const AssistantChatForm = memo(AssistantChatFormComponent)
