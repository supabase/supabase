import { CodeEditor } from '@/components/CodeEditor/CodeEditor'
import SchemaGraph from '@/components/SchemaGraph/SchemaGraph'

import { getThreadData } from '@/app/actions'

interface ThreadPageProps {
  params: {
    threadId: string
    runId: string
    messageId: string
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId, runId, messageId } = params

  const { tables, content } = await getThreadData(threadId, runId, messageId)

  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <SchemaGraph tables={tables} />
      <CodeEditor content={content} />
    </div>
  )
}
