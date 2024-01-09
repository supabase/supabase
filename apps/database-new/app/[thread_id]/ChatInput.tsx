'use client'

import { createThread } from '@/app/actions'
import { AssistantChatForm } from '@/components/AssistantChatForm'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from 'ui'

interface ChatInputProps {
  params: {
    thread_id: string
  }
}

function ChatInput({ params }: ChatInputProps) {
  //console.log('chatinput params', { params })
  const [value, setValue] = useState('')

  const { thread_id } = params

  const initialState = {
    message: undefined,
    success: undefined,
    data: {
      value,
    },
  }

  //const [state, formAction] = useFormState(createThread, initialState)

  const Message = () => {
    const { pending } = useFormStatus()

    //console.log('state.message', state.message)

    // return !state.success && state.success !== undefined && !pending ? (
    //   <p className="text-xs text-warning text-center w-full p-3">{state.message}</p>
    // ) : null
  }

  return (
    <div className="px-4 pb-4">
      {thread_id}
      <AssistantChatForm
        key={`chat-thread-form-${thread_id}`}
        id={`chat-thread-form-${thread_id}`}
        value={value}
        placeholder={'Any changes to make?'}
        onValueChange={(v) => setValue(v.target.value)}
        threadId={thread_id}
        //message={state.message}
      />

      {/* <Message /> */}
    </div>
  )
}

export { ChatInput }
