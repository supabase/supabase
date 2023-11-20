'use client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { last, sortBy } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Chat } from '@/components/Chat/Chat'
import { CodeEditor } from '@/components/CodeEditor'
import { Main } from '@/components/Main'
import SchemaGraph from '@/components/SchemaGraph'
import { AssistantMessage, PostgresTable, ReadThreadAPIResult } from '@/lib/types'
import { parseTables } from '@/lib/utils'
import Header from '@/components/Header'

export default function ThreadPage({ params }: { params: { threadId: string; runId: string } }) {
  const router = useRouter()
  const [tables, setTables] = useState<PostgresTable[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>(undefined)

  const { data, isSuccess } = useQuery<ReadThreadAPIResult>({
    queryFn: async () => {
      const response = await fetch(`/api/ai/sql/threads/${params.threadId}/read/${params.runId}`, {
        method: 'GET',
      })

      const result = await response.json()
      return result
    },
    queryKey: [params.threadId, params.runId],
    refetchInterval: (options) => {
      const data = options.state.data
      if (data && data.status === 'completed') {
        return Infinity
      }
      return 5000
    },
    enabled: !!(params.threadId && params.runId),
  })

  const { mutate } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch(`/api/ai/sql/threads/${params.threadId}/update`, {
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
      const url = `/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  const messages = useMemo(() => {
    if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
    return []
  }, [data?.messages, isSuccess])

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) as AssistantMessage | undefined,
    [messages, selectedMessageId]
  )

  const content = useMemo(
    () => selectedMessage?.sql.replaceAll('```sql', '').replaceAll('```', '') || '',
    [selectedMessage?.sql]
  )

  useEffect(() => {
    parseTables(content).then((t) => setTables(t))
  }, [content])

  // whenever the messages change (due to fetching), select the latest message
  useEffect(() => {
    const l = last(messages.filter((m) => m.role === 'assistant'))
    if (l) {
      setSelectedMessageId(l?.id)
    }
  }, [messages])

  return (
    <Main>
      <Header />
      <div className="flex flex-row items-center justify-between bg-alternative h-full">
        <Chat
          messages={messages}
          loading={isSuccess && data.status === 'loading'}
          selected={selectedMessageId}
          onSubmit={(str) => mutate(str)}
          onSelect={(id) => setSelectedMessageId(id)}
        />
        <SchemaGraph tables={tables} className="grow" />
        <CodeEditor content={content} />
      </div>
    </Main>
  )
}
