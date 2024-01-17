'use client'
import { useAppStateSnapshot } from '@/lib/state'
import { useMemo } from 'react'
import { format } from 'sql-formatter'
import { cn } from 'ui'
import { MonacoEditor } from './MonacoEditor'

export function ClientCodeEditor(props: { code: string }) {
  const snap = useAppStateSnapshot()

  const code = useMemo(() => {
    return snap.code || props.code
  }, [props.code, snap.code])
  console.log(snap.code.length, props.code.length)
  // strip the ```sql ``` from the code
  // not sure why we need this & can't get openai to stop returning it
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')
  let formattedCode = strippedCode
  if (!snap.isCodeStreaming) {
    formattedCode = format(strippedCode, { language: 'postgresql' })
  }

  /**
   * - CodeEditorContainer is a client component, which uses valtio state
   * - MonacoEditor is a server component injected into it
   */

  return (
    <div
      className={cn(
        snap.hideCode ? 'max-w-0' : 'max-w-lg 2xl:max-w-xl',
        // 'max-w-lg 2xl:max-w-xl',
        'w-full xl:border-l',
        'grow flex flex-col h-full'
      )}
    >
      <MonacoEditor id="sql-editor" language="pgsql" value={formattedCode} />
    </div>
  )
}
