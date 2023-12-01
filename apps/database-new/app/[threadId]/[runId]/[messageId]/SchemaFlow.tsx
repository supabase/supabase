import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'

import { parseTables } from '@/lib/utils'
import SchemaFlowHandler from './SchemaFlowHandler'

import OpenAI from 'openai'

const openai = new OpenAI()

async function waitForRunCompletion(params: { threadId: string; runId: string }) {
  console.log('waiting for run completion')
  let realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)

  while (realRun.status === 'in_progress') {
    console.log('while..')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)
    console.log('realRun', realRun.status)
  }

  console.log('Run completed:', realRun.status)
}

export async function SchemaFlow({ params }: { params: any }) {
  console.log('schemaFlow refetching')

  const { threadId, runId, messageId } = params

  // keep polling until the run is completed
  await waitForRunCompletion(params)

  const content = await getThread({ threadId, runId, messageId })

  // const code = format(content, { language: 'postgresql' })

  const tables = await parseTables(content)

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  return <SchemaFlowHandler tables={tables} />
}
