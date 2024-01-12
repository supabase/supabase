import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { CodeEditor } from '../CodeEditor'
import { SchemaFlow } from '../SchemaFlow'
import { Suspense } from 'react'
import SchemaLoader from '@/components/Loaders/SchemaLoader'
import GraphLoader from '@/components/Loaders/GraphLoader'

export interface ThreadPageProps {
  params: {
    message_id: string
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      <Suspense fallback={<SchemaLoader />}>
        <SchemaFlow params={params} />
      </Suspense>
      <Suspense fallback={<GraphLoader />}>
        <CodeEditor params={params} />
      </Suspense>
    </div>
  )
}
