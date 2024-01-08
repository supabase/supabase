import { format } from 'sql-formatter'
import { CodeEditorContainer } from './CodeEditorContainer'
import { MonacoEditor } from './MonacoEditor'

interface CodeEditorProps {
  code: string
}

export async function CodeEditor({ code }: CodeEditorProps) {
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
