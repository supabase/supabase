'use client'

import { Chat } from '@/components/Chat/Chat'
import { useMutation, useQuery } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import React, { useMemo } from 'react'

import { ReadThreadAPIResult } from '@/lib/types'
import { useRouter, useParams } from 'next/navigation'

export default function Layout({
  params,
  children,
}: {
  children: React.ReactNode
  params: { threadId: string; runId: string }
}) {
  const router = useRouter()

  const { runId, threadId, messageId } = useParams()

  console.log('params', params)

  const { data, isSuccess } = useQuery<ReadThreadAPIResult>({
    queryFn: async () => {
      const response = await fetch(`/api/ai/sql/threads/${threadId}/read/${runId}`, {
        method: 'GET',
      })

      const result = await response.json()
      return result
    },
    queryKey: [threadId, runId],
    refetchInterval: (options) => {
      const data = options.state.data
      if (data && data.status === 'completed') {
        return Infinity
      }
      return 5000
    },
    enabled: !!(threadId && runId),
  })

  const messages = useMemo(() => {
    if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
    return []
  }, [data?.messages, isSuccess])

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
      console.log(result)
      return result
    },
    onSuccess(data) {
      const url = `/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  console.log('messages', messages)
  console.log('data', data)

  return (
    <div className="flex flex-row items-center justify-between bg-alternative h-full">
      <Chat
        messages={messages}
        loading={isSuccess && data.status === 'loading'}
        selected={messageId}
        onSubmit={(str) => mutate(str)}
        onSelect={(messageId, replyId) => {
          // setSelectedMessageId(messageId)
          // setSelectedReplyId(replyId)
        }}
      />
      {children}
    </div>
  )
}
