import { Loader2 } from 'lucide-react'
import React, { ChangeEvent, createRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { TextArea_Shadcn_, cn } from 'ui'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  loading?: boolean
  disabled?: boolean
  value?: string
  onValueChange: (value: ChangeEvent<HTMLTextAreaElement>) => void
  message?: string
  children?: React.ReactNode
}

const AssistantChatForm = React.forwardRef<HTMLFormElement, FormProps>(
  ({ loading, disabled, value, onValueChange, message, ...props }, ref) => {
    const textAreaRef = createRef<HTMLTextAreaElement>()
    const submitRef = createRef<HTMLButtonElement>()

    useEffect(() => {
      if (textAreaRef) {
        if (!value && textAreaRef && textAreaRef.current) {
          textAreaRef.current.style.height = '40px'
        } else if (textAreaRef && textAreaRef.current) {
          const newHeight = textAreaRef.current.scrollHeight + 'px'
          textAreaRef.current.style.height = newHeight
        }
      }
    }, [value, textAreaRef])

    useEffect(() => {
      textAreaRef?.current?.focus()
    }, [value, textAreaRef])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Check if the pressed key is "Enter" (key code 13) without the "Shift" key
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (submitRef.current) {
          submitRef.current.click()
        }
      }
    }

    const SubmitButton = () => {
      const { pending } = useFormStatus()

      return (
        <div className="absolute right-1.5 top-1.5 flex gap-3 items-center">
          {loading || pending ? (
            <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
          ) : null}

          <button
            title="Send AI prompt"
            ref={submitRef}
            type="submit"
            disabled={pending}
            className={cn(
              'transition-all',
              'flex items-center justify-center w-7 h-7 border border-control rounded-full mr-0.5 p-1.5 background-alternative',
              !value ? 'text-muted opacity-50' : 'text-default opacity-100',
              loading || pending ? 'hidden' : ''
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
              ></path>
            </svg>
          </button>
        </div>
      )
    }

    return (
      <form ref={ref} className="relative" {...props}>
        <div className={cn('absolute', 'top-2 left-2', 'ml-1 w-6 h-6 rounded-full bg-dbnew')}></div>
        <TextArea_Shadcn_
          name="value"
          ref={textAreaRef}
          autoFocus
          rows={1}
          disabled={disabled || submitRef.current?.disabled}
          contentEditable
          required
          className={
            'transition-all text-sm pl-12 pr-10 rounded-[18px] resize-none box-border leading-6'
          }
          placeholder={props.placeholder}
          spellCheck={false}
          value={value}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onValueChange(event)}
          onKeyDown={handleKeyDown}
        />
        {props.children}
        <SubmitButton />
        <p aria-live="polite" className="sr-only" role="status">
          {message}
        </p>
      </form>
    )
  }
)

AssistantChatForm.displayName = 'AssistantChatForm'

export { AssistantChatForm }
