import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'
import { MonacoEditor } from './MonacoEditor'
import { CodeEditorContainer } from './CodeEditorContainer'

export async function CodeEditor({ params }: { params: any }) {
  const { threadId, runId, messageId } = params

  const content = await getThread({ threadId, runId, messageId })

  const code = format(content, { language: 'postgresql' })

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
