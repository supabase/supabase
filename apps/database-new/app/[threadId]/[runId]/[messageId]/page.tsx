import { CodeEditor } from '@/app/[threadId]/[runId]/[messageId]/CodeEditor'
import { SchemaFlow } from '@/app/[threadId]/[runId]/[messageId]/SchemaFlow'
import { Suspense } from 'react'

interface ThreadPageProps {
  params: {
    threadId: string
    runId: string
    messageId: string
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <Suspense fallback={<p>loading..</p>}>
        <SchemaFlow params={params} />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <CodeEditor params={params} />
      </Suspense>
    </div>
  )
}
