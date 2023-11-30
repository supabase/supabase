import Editor, { OnChange, OnMount } from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { MutableRefObject, useRef } from 'react'
import { cn } from 'ui'

import { alignEditor } from 'components/ui/CodeEditor'
import { Markdown } from 'components/interfaces/Markdown'

// [Joshen] Is there a way we can just have one single MonacoEditor component that's shared across the dashboard?
// Feels like we're creating multiple copies of Editor

interface RLSCodeEditorProps {
  id: string
  defaultValue?: string
  onInputChange?: (value?: string) => void
  wrapperClassName?: string
  className?: string
  value?: string
  editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
}

// const placeholderText = `
// CREATE POLICY *name* ON *table_name*\n
// [ AS { PERMISSIVE | RESTRICTIVE } ]\n
// [ FOR { ALL | SELECT | INSERT | UPDATE | DELETE } ]\n
// [ TO *role_name* ]\n
// [ USING ( *using_expression* ) ]\n
// [ WITH CHECK ( *check_expression* ) ];
// `.trim()

const placeholderText = `
CREATE POLICY *name* ON *table_name*\n
AS PERMISSIVE -- PERMISSIVE | RESTRICTIVE\n
FOR ALL -- ALL | SELECT | INSERT | UPDATE | DELETE\n
TO *role_name* -- Default: public\n
USING ( *using_expression* )\n
WITH CHECK ( *check_expression* );\n
&nbsp;\n
-- Docs: https://www.postgresql.org/docs/current/sql-createpolicy.html
`.trim()

const RLSCodeEditor = ({
  id,
  defaultValue,
  wrapperClassName,
  className,
  value,
  editorRef,
}: RLSCodeEditorProps) => {
  const hasValue = useRef<any>()

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    alignEditor(editor)

    hasValue.current = editor.createContextKey('hasValue', false)

    const placeholder = document.querySelector('.monaco-placeholder') as HTMLElement | null
    if (placeholder) placeholder.style.display = 'block'

    editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        editor.executeEdits('source', [
          {
            // @ts-ignore
            identifier: 'add-placeholder',
            range: new monaco.Range(1, 1, 1, 1),
            text: placeholderText
              .split('\n\n')
              .join('\n')
              .replaceAll('*', '')
              .replaceAll('&nbsp;', ''),
          },
        ])
      },
      '!hasValue'
    )

    editor.focus()
  }

  const onChange: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)

    const placeholder = document.querySelector('.monaco-placeholder') as HTMLElement | null
    if (placeholder) {
      if (!value) {
        placeholder.style.display = 'block'
      } else {
        placeholder.style.display = 'none'
      }
    }
  }

  const options = {
    tabSize: 2,
    fontSize: 13,
    readOnly: false,
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    fixedOverflowWidgets: true,
    contextmenu: true,
    lineNumbers: undefined,
    glyphMargin: undefined,
    lineNumbersMinChars: 4,
    folding: undefined,
    scrollBeyondLastLine: false,
  }

  return (
    <>
      <Editor
        path={id}
        theme="supabase"
        wrapperProps={{ className: cn(wrapperClassName) }}
        className={cn(className, 'monaco-editor')}
        value={value ?? undefined}
        defaultLanguage="pgsql"
        defaultValue={defaultValue ?? undefined}
        options={options}
        onMount={onMount}
        onChange={onChange}
      />
      <div
        className="monaco-placeholder absolute top-[3px] left-[57px] text-sm pointer-events-none font-mono [&>div>p]:text-foreground-lighter [&>div>p]:!m-0 tracking-tighter"
        style={{ display: 'none' }}
      >
        <Markdown content={placeholderText} />
      </div>
    </>
  )
}

export default RLSCodeEditor
