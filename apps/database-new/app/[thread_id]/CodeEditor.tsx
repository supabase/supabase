import { format } from 'sql-formatter'
import { CodeEditorContainer } from './CodeEditorContainer'
import { MonacoEditor } from './MonacoEditor'
import { ThreadPageProps } from './[message_id]/page'
import { getMessage } from './getMessage'

export async function CodeEditor({ params }: ThreadPageProps) {
  const { message_id } = params
  const code = await getMessage(message_id)

  // strip the ```sql ``` from the code
  // not sure why we need this & can't get openai to stop returning it
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')
  const formattedCode = format(strippedCode, { language: 'postgresql' })

  /**
   * - CodeEditorContainer is a client component, which uses valtio state
   * - MonacoEditor is a server component injected into it
   */

  return (
    <CodeEditorContainer>
      <MonacoEditor id="sql-editor" language="pgsql" value={formattedCode} />
    </CodeEditorContainer>
  )
}
