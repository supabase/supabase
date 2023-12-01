import { CodeEditor } from '@/app/[threadId]/[runId]/[messageId]/CodeEditor'
import { SchemaFlow } from '@/app/[threadId]/[runId]/[messageId]/SchemaFlow'
import { Loader2 } from 'lucide-react'
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
      <Suspense fallback={<Loader />}>
        <SchemaFlow params={params} />
      </Suspense>
      <Suspense fallback={<Loader />}>
        <CodeEditor params={params} />
      </Suspense>
    </div>
  )
}

const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full text-muted">
      <Loader2 className="animate-spin opacity-100" size={16} strokeWidth={1} />
    </div>
  )
}
