'use client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { last, sortBy } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Chat } from '@/components/Chat/Chat'
import { CodeEditor } from '@/components/CodeEditor/CodeEditor'
import { Main } from '@/components/Main'
import SchemaGraph from '@/components/SchemaGraph/SchemaGraph'
import { AssistantMessage, PostgresTable, ReadThreadAPIResult, UserMessage } from '@/lib/types'
import { parseTables } from '@/lib/utils'
import Header from '@/components/Header'
import { Modal } from 'ui'
import AllThreadsModal from '@/components/AllThreadsModal/AllThreadsModal'

export default function ThreadPage({ params }: { params: { threadId: string; runId: string } }) {
  const router = useRouter()
  const [hideCode, setHideCode] = useState(false)
  const [showAllThreads, setShowAllThreads] = useState(false)
  const [tables, setTables] = useState<PostgresTable[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>(undefined)
  const [selectedReplyId, setSelectedReplyId] = useState<string | undefined>(undefined)

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
    () => messages.find((m) => m.id === selectedReplyId) as AssistantMessage | undefined,
    [messages, selectedReplyId]
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
    const message = last(messages.filter((m) => m.role === 'user'))
    const reply = last(messages.filter((m) => m.role === 'assistant'))
    if (message) setSelectedMessageId(message.id)
    if (reply) setSelectedReplyId(reply.id)
  }, [messages])

  return (
    <Main>
      <Header
        selectedMessage={
          messages.find((message) => message.id === selectedMessageId) as UserMessage
        }
        hideCode={hideCode}
        setHideCode={setHideCode}
        showAllThreads={() => setShowAllThreads(true)}
      />
      <div className="flex flex-row items-center justify-between bg-alternative h-full">
        <Chat
          messages={messages}
          loading={isSuccess && data.status === 'loading'}
          selected={selectedReplyId}
          onSubmit={(str) => mutate(str)}
          onSelect={(messageId, replyId) => {
            setSelectedMessageId(messageId)
            setSelectedReplyId(replyId)
          }}
        />
        <SchemaGraph tables={tables} />
        <CodeEditor content={content} hideCode={hideCode} />
      </div>
      <AllThreadsModal
        visible={showAllThreads}
        onClose={() => setShowAllThreads(false)}
        onSelectMessage={(messageId, replyId) => {
          setShowAllThreads(false)
          setSelectedMessageId(messageId)
          setSelectedReplyId(replyId)
        }}
      />
    </Main>
  )
}
