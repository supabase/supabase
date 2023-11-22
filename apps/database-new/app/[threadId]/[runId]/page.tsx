'use client'
import { last, sortBy } from 'lodash'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'

import { CodeEditor } from '@/components/CodeEditor/CodeEditor'
import SchemaGraph from '@/components/SchemaGraph/SchemaGraph'
import { useMessagesQuery } from '@/data/messages-query'

export default function ThreadPage() {
  const router = useRouter()
  const { threadId, runId }: { threadId: string; runId: string } = useParams()

  const { data, isSuccess } = useMessagesQuery({ threadId, runId })

  const messages = useMemo(() => {
    if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
    return []
  }, [data?.messages, isSuccess])

  useEffect(() => {
    if (isSuccess && messages.length > 0) {
      const latestMessage = last(messages.filter((message) => message.role === 'user'))
      if (latestMessage) router.push(`/${threadId}/${runId}/${latestMessage.id}`)
    }
  }, [isSuccess])

  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <SchemaGraph tables={[]} />
      <CodeEditor content="" />
    </div>
  )
}
