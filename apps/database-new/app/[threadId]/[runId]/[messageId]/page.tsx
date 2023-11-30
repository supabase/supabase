import { last, sortBy } from 'lodash'
import { redirect } from 'next/navigation'

import { CodeEditor } from '@/components/CodeEditor/CodeEditor'
import SchemaGraph from '@/components/SchemaGraph/SchemaGraph'

import { AssistantMessage } from '@/lib/types'
import { parseTables } from '@/lib/utils'

interface ThreadPageProps {
  params: {
    threadId: string
    runId: string
    messageId: string
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId, runId, messageId } = params

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/sql/threads/${threadId}/read/${runId}`,
    {
      method: 'GET',
    }
  )
  const data = await response.json()
  const messages = sortBy(data.messages, (m) => m.created_at)
  console.log({ messages })

  const userMessages = messages.filter((m) => m.role === 'user')

  const selectedMessageIdx = messages.findIndex((m) => m.id === messageId)
  const selectedMessageReply = (
    selectedMessageIdx !== -1 ? messages[selectedMessageIdx + 1] : undefined
  ) as AssistantMessage | undefined

  const content = selectedMessageReply?.sql.replaceAll('```sql', '').replaceAll('```', '') || ''
  console.log({ content })

  const tables = await parseTables(content)
  // const latestMessage = last(userMessages)
  // if (latestMessage) redirect(`/${threadId}/${runId}/${latestMessage.id}`)

  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      hello there {threadId}
      {/* <SchemaGraph tables={tables} />
      <CodeEditor content={content} /> */}
    </div>
  )
}
