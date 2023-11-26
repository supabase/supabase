'use client'
import { last, sortBy } from 'lodash'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CodeEditor } from '@/components/CodeEditor/CodeEditor'
import SchemaGraph from '@/components/SchemaGraph/SchemaGraph'
import { useMessagesQuery } from '@/data/messages-query'
import { AssistantMessage, PostgresTable } from '@/lib/types'
import { parseTables } from '@/lib/utils'

export default function ThreadPage() {
  const router = useRouter()
  const { threadId, runId, messageId }: { threadId: string; runId: string; messageId: string } =
    useParams()
  const [tables, setTables] = useState<PostgresTable[]>([])

  const { data, isSuccess } = useMessagesQuery({ threadId, runId })

  // [Joshen] Slightly hacky here, just so the useEffect triggers once - until we figure out something better
  const isLoadingPrev = useRef<boolean>(false)
  const isLoading = isSuccess && data.status === 'loading'

  const messages = useMemo(() => {
    if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
    return []
  }, [data?.messages, isSuccess])

  const userMessages = messages.filter((m) => m.role === 'user')

  const selectedMessageIdx = useMemo(() => {
    return messages.findIndex((m) => m.id === messageId)
  }, [messages, messageId])

  const selectedMessageReply = useMemo(
    () =>
      (selectedMessageIdx !== -1 ? messages[selectedMessageIdx + 1] : undefined) as
        | AssistantMessage
        | undefined,
    [messages, selectedMessageIdx]
  )

  const content = useMemo(
    () => selectedMessageReply?.sql.replaceAll('```sql', '').replaceAll('```', '') || '',
    [selectedMessageReply?.sql]
  )

  useEffect(() => {
    parseTables(content).then((t) => setTables(t))
  }, [content])

  useEffect(() => {
    if (isLoadingPrev.current && !isLoading) {
      const latestMessage = last(userMessages)
      if (latestMessage) router.push(`/${threadId}/${runId}/${latestMessage.id}`)
    }
    isLoadingPrev.current = isLoading
  }, [isLoading])

  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <SchemaGraph tables={tables} />
      <CodeEditor content={content} />
    </div>
  )
}
