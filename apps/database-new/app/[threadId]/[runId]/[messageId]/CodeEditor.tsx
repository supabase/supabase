import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'
import { MonacoEditor } from './MonacoEditor'
import { CodeEditorContainer } from './CodeEditorContainer'

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

export async function CodeEditor({ params }: { params: any }) {
  const { threadId, runId, messageId } = params

  await waitForRunCompletion(params)

  const content = await getThread({ threadId, runId, messageId })

  const code = format(content, { language: 'postgresql' })

  // keep polling until the run is completed

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  /**
   * - CodeEditorContainer is a client component, which uses valtio state
   * - MonacoEditor is a server component injected into it
   */

  return (
    <CodeEditorContainer>
      <MonacoEditor id="sql-editor" language="pgsql" value={code} />
    </CodeEditorContainer>
  )
}
