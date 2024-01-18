import { format } from 'sql-formatter'

import { MonacoEditor } from '@/components/MonacoEditor'
import { cn } from '@ui/lib/utils/cn'

export async function CodeEditor({ promisedMessage }: { promisedMessage: Promise<string> }) {
  const code = await promisedMessage

  // strip the ```sql ``` from the code
  // not sure why we need this & can't get openai to stop returning it
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')
  const formattedCode = format(strippedCode, { language: 'postgresql' })

  const hideCode = false
  /**
   * - CodeEditorContainer is a client component, which uses valtio state
   * - MonacoEditor is a server component injected into it
   */
  return (
    <div
      className={cn(
        hideCode ? 'max-w-0' : 'max-w-lg 2xl:max-w-xl',
        // 'max-w-lg 2xl:max-w-xl',
        'w-full xl:border-l',
        'grow flex flex-col h-full'
      )}
    >
      <MonacoEditor id="sql-editor" language="pgsql" value={formattedCode} />
    </div>
  )
}
