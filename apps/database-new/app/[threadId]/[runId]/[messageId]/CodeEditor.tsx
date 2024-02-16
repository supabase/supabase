import { format } from 'sql-formatter'
import { Code } from 'bright'

import { getThread } from './MessageId.utils'
import { MonacoEditor } from './MonacoEditor'
import { CodeEditorContainer } from './CodeEditorContainer'

import OpenAI from 'openai'
import CopyToClipboard from './CopyToClipboard'

const openai = new OpenAI()

async function waitForRunCompletion(params: { threadId: string; runId: string }) {
  console.log('waiting for run completion')
  let realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)

  while (realRun.status === 'in_progress') {
    //console.log('while..')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)
    //console.log('realRun', realRun.status)
  }

  //console.log('Run completed:', realRun.status)
}

export async function CodeEditor({ params }: { params: any }) {
  const { threadId, runId, messageId } = params

  await waitForRunCompletion(params)

  const content = await getThread({ threadId, runId, messageId })

  const code = format(content, { language: 'postgresql' })

  const highlight = {
    name: 'highlight',
    MultilineAnnotation: ({ children }: any) => {
      return <span className="block bg-blue-700 bg-opacity-50">{children}</span>
    },
  }
  // keep polling until the run is completed

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  /**
   * - CodeEditorContainer is a client component, which uses valtio state
   * - MonacoEditor is a server component injected into it
   */
  Code.theme = {
    dark: 'github-dark',
    light: 'github-light',
  }

  return (
    <CodeEditorContainer>
      {/* <MonacoEditor id="sql-editor" language="pgsql" value={code} /> */}
      <div className="relative overflow-scroll">
        <span className="absolute top-2 right-2 ">
          <CopyToClipboard code={code} />
        </span>
        <Code lang="sql" lineNumbers className="text-sm ">
          {code}
        </Code>
      </div>
    </CodeEditorContainer>
  )
}
