'use client'
import { useMutation } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Input, ScrollArea, cn } from 'ui'

import { useMessagesQuery } from '@/data/messages-query'
import { AssistantMessage, UserMessage } from '@/lib/types'
import BottomMarker from './BottomMarker'
import UserChat from './UserChat'
import { ChatInputAtom } from '@/components/Chat/ChatInput'

export const Chat = () => {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [inputEntered, setInputEntered] = useState(false)
  const { threadId, runId, messageId }: { threadId: string; runId: string; messageId: string } =
    useParams()

  const { data, isSuccess } = useMessagesQuery({ threadId, runId })

  const messages = useMemo(() => {
    if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
    return []
  }, [data?.messages, isSuccess])

  const selectedMessage = messageId
  const loading = isSuccess && data.status === 'loading'
  const userMessages = messages.filter((message) => message.role === 'user')

  const { mutate } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch(`/api/ai/sql/threads/${threadId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      return result
    },
    onSuccess(data) {
      const url = messageId
        ? `/${data.threadId}/${data.runId}/${messageId}`
        : `/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  useEffect(() => {
    setInputEntered(false)
    setValue('')
  }, [loading])

  return (
    <div
      className={cn(
        'bg',
        'h-full',
        'border-t xl:border-t-0 xl:border-r relative',
        'flex flex-col h-full border-r',
        'w-full xl:w-[400px] 2xl:w-[500px]'
      )}
    >
      <div className="flex flex-col grow items-between">
        {messages.length === 0 ? (
          <div className="grow flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <ScrollArea className="grow h-px">
            <div className="flex flex-col py-2 xl:py-6">
              {userMessages.map((message, idx) => {
                const index = messages.indexOf(message)
                const reply = messages[index + 1] as AssistantMessage
                const isLatest = idx === userMessages.length - 1
                return (
                  <UserChat
                    key={message.id}
                    message={message as UserMessage}
                    reply={reply}
                    isLatest={isLatest}
                    isSelected={selectedMessage === message?.id}
                    isLoading={loading && isLatest}
                  />
                )
              })}
              <BottomMarker />
            </div>
          </ScrollArea>
        )}

        <div className="px-4 pb-4">
          <ChatInputAtom
            value={value}
            disabled={loading || inputEntered}
            loading={loading || inputEntered}
            placeholder={
              loading
                ? 'Generating reply to request...'
                : 'Ask for some changes on the selected message'
            }
            onChange={(v) => setValue(v.target.value)}
            handleSubmit={() => {
              if (value && value.length > 0) {
                mutate(value)
                setInputEntered(true)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
