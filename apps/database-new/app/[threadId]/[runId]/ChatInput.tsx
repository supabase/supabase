'use client'

import { updateThread } from '@/app/actions'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { AssistantChatForm, Input } from 'ui'

function ChatInput({ params }: { params: { threadId: string; runId: string } }) {
  const [value, setValue] = useState('')

  const { threadId, runId } = params

  const initialState = {
    message: undefined,
    success: undefined,
    data: {
      value,
    },
  }

  const [state, formAction] = useFormState(updateThread, initialState)

  const Message = () => {
    const { pending } = useFormStatus()

    return !state.success && state.success !== undefined && !pending ? (
      <p className="text-xs text-warning text-center w-full p-3">{state.message}</p>
    ) : null
  }

  return (
    <div className="px-4 pb-4">
      <AssistantChatForm
        action={formAction}
        key={`chat-thread-form-${runId}`}
        id={`chat-thread-form-${runId}`}
        value={value}
        placeholder={
          // loading
          // ? 'Generating reply to request...'
          // :
          'Ask for some changes on the selected message'
        }
        onValueChange={(v) => setValue(v.target.value)}
        message={state.message}
      >
        <Input
          type="hidden"
          name="threadId"
          value={threadId}
          key={`chat-thread-form-${threadId}`}
        />
        <Input type="hidden" name="runId" value={runId} key={`chat-thread-form-${runId}}`} />
      </AssistantChatForm>
      <Message />
    </div>
  )
}

export { ChatInput }
