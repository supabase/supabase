'use client'
import { ScrollArea } from 'ui'

import { AssistantChatForm } from '@/components/AssistantChatForm'
import { useAppStateSnapshot } from '@/lib/state'
import { Message, useChat } from 'ai/react'
import { last } from 'lodash'
import { useEffect, useMemo } from 'react'
import { createThread } from '../actions'
import { BottomMarker } from './BottomMarker'
import { Messages } from './Messages'

export const ClientMessages = ({
  threadId,
  messages,
}: {
  threadId: string
  messages: {
    created_at: string
    id: string
    message_content: string
    message_id: string
    message_input: string
    message_role: string
    thread_id: string
    user_id: string | null
  }[]
}) => {
  const initialMessages = messages.flatMap((m) => [
    {
      id: m.message_id,
      content: m.message_input,
      role: 'user' as const,
      createdAt: new Date(m.created_at),
    },
    {
      id: m.message_id,
      content: m.message_content,
      role: 'assistant' as const,
      createdAt: new Date(m.created_at),
    },
  ])
  const snap = useAppStateSnapshot()

  const {
    messages: chatMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    initialMessages,
    onFinish: redirectOnFinish,
  })
  const lastMessage = last(chatMessages.filter((m) => m.role === 'assistant'))
  useEffect(() => {
    snap.setIsCodeStreaming(isLoading)
    if (isLoading && lastMessage?.content) {
      snap.setCode(lastMessage?.content)
    }
  }, [isLoading, lastMessage?.content, snap])

  async function redirectOnFinish(message: Message) {
    createThread(input, message, threadId)
  }

  const userMessages = useMemo(() => {
    return chatMessages.filter((m) => m.role === 'user')
  }, [chatMessages])

  return (
    <>
      <ScrollArea className="grow h-px">
        <div className="flex flex-col py-2 xl:py-6">
          <Messages messages={userMessages} />
          <BottomMarker />
        </div>
      </ScrollArea>
      <div className="px-4 pb-4">
        <AssistantChatForm
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          chatContext={'edit'}
          placeholder={'Any changes to make?'}
        />
      </div>
    </>
  )
}
