'use client'

import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ChangeEvent, FormHTMLAttributes, ReactNode, forwardRef, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { TextArea_Shadcn_, cn } from 'ui'

import { ChatSuggestions } from './ChatSuggestions'
import { upsertMessageFormAction } from './action'

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  loading?: boolean
  disabled?: boolean
  message?: string
  children?: ReactNode
  chatContext: 'new' | 'edit'
}

const SubmitButton = forwardRef<HTMLButtonElement, { isLoading: boolean; canSubmit: boolean }>(
  ({ canSubmit }, ref) => {
    const { pending } = useFormStatus()

    return (
      <div className="absolute right-1.5 top-1.5 flex gap-3 items-center">
        {pending && (
          <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
        )}

        <button
          title="Send AI prompt"
          ref={ref}
          type="submit"
          disabled={pending || canSubmit}
          className={cn(
            'transition-all',
            'flex items-center justify-center w-7 h-7 border border-control rounded-full mr-0.5 p-1.5 background-alternative',
            canSubmit ? 'text-default opacity-100' : 'text-muted opacity-50',
            pending ? 'hidden' : ''
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
  canSubmit?: () => Promise<boolean>
}

const AssistantChatForm = ({
  chatContext,
  placeholder,
  canSubmit = () => Promise.resolve(true),
}: AssistantChatFormProps) => {
  const { thread_id } = useParams()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const disabled = false

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.shiftKey && (e.key === 'Enter' || e.key === 'NumpadEnter')) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target
    let newHeight = target.scrollHeight + 'px'
    const input = target.value
    if (!input) {
      newHeight = '40px'
    }
    if (target.style.height !== newHeight) {
      target.style.height = newHeight
    }
  }

  return (
    <>
      <form
        className="relative"
        action={async (formData) => {
          const flag = await canSubmit()
          if (flag) {
            upsertMessageFormAction(formData)
          }
        }}
      >
        <div className={cn('absolute', 'top-2 left-2', 'ml-1 w-6 h-6 rounded-full bg-dbnew')}></div>
        <input hidden name="threadId" defaultValue={thread_id} />
        <TextArea_Shadcn_
          name="prompt"
          ref={textAreaRef}
          autoFocus
          rows={1}
          defaultValue=""
          disabled={disabled}
          contentEditable
          required
          className={
            'transition-all text-sm pl-12 pr-10 rounded-[18px] resize-none box-border leading-6'
          }
          style={{ height: '40px' }}
          placeholder={placeholder}
          spellCheck={false}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
        <SubmitButton
          canSubmit={(textAreaRef?.current?.value || '').length > 0}
          isLoading={disabled}
        />
      </form>
      {chatContext === 'new' && (
        <ChatSuggestions
          setInput={(v) => {
            if (textAreaRef?.current) textAreaRef.current.value = v
          }}
        />
      )}
    </>
  )
}

AssistantChatForm.displayName = 'AssistantChatForm'

export { AssistantChatForm }
