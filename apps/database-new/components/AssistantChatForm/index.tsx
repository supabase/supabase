'use client'

import { Loader2 } from 'lucide-react'
import { FormHTMLAttributes, KeyboardEvent, ReactNode, forwardRef, useRef } from 'react'
import { TextArea_Shadcn_, cn } from 'ui'

import { useParams } from 'next/navigation'
import ChatLoadingAnimation from './ChatLoadingAnimation'
import { ChatSuggestions } from './ChatSuggestions'
import { upsertMessageFormAction } from './action'

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  loading?: boolean
  disabled?: boolean
  message?: string
  children?: ReactNode
  chatContext: 'new' | 'edit'
}

const SubmitButton = forwardRef<HTMLButtonElement, { isLoading: boolean; input: string }>(
  ({ isLoading, input }, ref) => {
    return (
      <div className="absolute right-1.5 top-1.5 flex gap-3 items-center">
        {isLoading && (
          <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
        )}

        <button
          title="Send AI prompt"
          ref={ref}
          type="submit"
          disabled={isLoading}
          className={cn(
            'transition-all',
            'flex items-center justify-center w-7 h-7 border border-control rounded-full mr-0.5 p-1.5 background-alternative',
            !input ? 'text-muted opacity-50' : 'text-default opacity-100',
            isLoading ? 'hidden' : ''
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
)

SubmitButton.displayName = 'SubmitButton'

interface AssistantChatFormProps {
  chatContext: string
  placeholder: string
}

const AssistantChatForm = ({ chatContext, placeholder }: AssistantChatFormProps) => {
  const { thread_id } = useParams()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const disabled = false

  // useEffect(() => {
  //   if (textAreaRef) {
  //     textAreaRef?.current?.focus()

  //     if (!input && textAreaRef && textAreaRef.current) {
  //       textAreaRef.current.style.height = '40px'
  //     } else if (textAreaRef && textAreaRef.current) {
  //       const newHeight = textAreaRef.current.scrollHeight + 'px'
  //       textAreaRef.current.style.height = newHeight
  //     }
  //   }
  // }, [input, textAreaRef])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Check if the pressed key is "Enter" (key code 13) without the "Shift" key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (submitRef.current) {
        submitRef.current.click()
      }
    }

    // Cast e.target to HTMLTextAreaElement to access the 'value' property
    const textarea = e.target as HTMLTextAreaElement
    // setInput(textarea.value)
  }

  return (
    <>
      {disabled && <ChatLoadingAnimation />}
      <form className="relative" action={upsertMessageFormAction}>
        <div className={cn('absolute', 'top-2 left-2', 'ml-1 w-6 h-6 rounded-full bg-dbnew')}></div>
        <input hidden name="threadId" defaultValue={thread_id} />
        <TextArea_Shadcn_
          name="prompt"
          ref={textAreaRef}
          autoFocus
          rows={1}
          defaultValue=""
          disabled={disabled || submitRef.current?.disabled}
          contentEditable
          required
          className={
            'transition-all text-sm pl-12 pr-10 rounded-[18px] resize-none box-border leading-6'
          }
          placeholder={placeholder}
          spellCheck={false}
          onKeyDown={(e) => handleKeyDown(e)}
        />
        {/* {props.children} */}
        <SubmitButton input={''} isLoading={disabled} ref={submitRef} />
        {/* <p aria-live="polite" className="sr-only" role="status">
            {message}
          </p> */}
      </form>
      {chatContext === 'new' && (
        <ChatSuggestions
          setInput={(v) => {
            if (textAreaRef?.current) textAreaRef.current.value = 'v'
          }}
        />
      )}
    </>
  )
}

AssistantChatForm.displayName = 'AssistantChatForm'

export { AssistantChatForm }
