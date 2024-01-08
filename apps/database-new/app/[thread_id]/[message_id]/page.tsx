// import { CodeEditor } from '@/app/[threadId]/[runId]/[messageId]/CodeEditor'
// import { SchemaFlow } from '@/app/[threadId]/[runId]/[messageId]/SchemaFlow'
// import GraphLoader from '@/components/Loaders/GraphLoader'
// import SchemaLoader from '@/components/Loaders/SchemaLoader'
// import { Loader2 } from 'lucide-react'
// import Image from 'next/image'
// import { Suspense } from 'react'

import GraphLoader from '@/components/Loaders/GraphLoader'
import SchemaLoader from '@/components/Loaders/SchemaLoader'
import { Suspense } from 'react'
import { CodeEditor } from '../CodeEditor'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SchemaFlow } from '../SchemaFlow'

interface ThreadPageProps {
  params: {
    message_id: string
  }
}

async function getMessage(message_id: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: message, error } = await supabase
    .from('messages')
    .select('message_content')
    .eq('message_id', message_id)
    .single()
  if (error) {
    throw new Error('Failed to fetch message')
  }
  return message.message_content
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { message_id } = params
  const message_content = await getMessage(message_id)

  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <Suspense fallback={<SchemaLoader />}>
        <SchemaFlow code={message_content} />
      </Suspense>
      {message_content && (
        <Suspense fallback={<GraphLoader />}>
          <CodeEditor code={message_content} />
        </Suspense>
      )}
    </div>
  )
}
