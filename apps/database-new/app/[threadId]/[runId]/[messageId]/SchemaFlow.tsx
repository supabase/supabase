import { getThread } from './MessageId.utils'

import { parseTables } from '@/lib/utils'
import SchemaFlowHandler from './SchemaFlowHandler'

import OpenAI from 'openai'

const openai = new OpenAI()

async function waitForRunCompletion(params: {
  threadId: string
  runId: string
  messageId: string
}) {
  let realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)

  while (realRun.status === 'in_progress') {
    console.log('while.. waiting for in_progress status to change for ', params.runId)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)
    console.log('realRun', realRun.status)
  }

  console.log('Run completed:', realRun.status)
  return
}

export async function SchemaFlow({ params }: { params: any }) {
  const { threadId, runId, messageId } = params

  // keep polling until the run is completed
  await waitForRunCompletion(params)

  const content = await getThread({ threadId, runId, messageId })

  // const code = format(content, { language: 'postgresql' })

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  return <SchemaFlowHandler content={content} />
}
