import { format } from 'sql-formatter'

import { MonacoEditor } from '@/components/MonacoEditor'
import { CodeEditorContainer } from './CodeEditorContainer'

export async function CodeEditor({ promisedMessage }: { promisedMessage: Promise<string> }) {
  const code = await promisedMessage

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
