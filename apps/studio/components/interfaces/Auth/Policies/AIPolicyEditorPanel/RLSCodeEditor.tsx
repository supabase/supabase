import Editor, { Monaco, OnChange, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { MutableRefObject, useRef } from 'react'
import { cn } from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { noop } from 'lodash'

// [Joshen] Is there a way we can just have one single MonacoEditor component that's shared across the dashboard?
// Feels like we're creating multiple copies of Editor

interface RLSCodeEditorProps {
  id: string
  defaultValue?: string
  onInputChange?: (value?: string) => void
  wrapperClassName?: string
  className?: string
  value?: string
  placeholder?: string
  readOnly?: boolean

  lineNumberStart?: number
  onChange?: () => void

  editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
  monacoRef?: MutableRefObject<Monaco>
}

const RLSCodeEditor = ({
  id,
  defaultValue,
  wrapperClassName,
  className,
  value,
  placeholder,
  readOnly = false,

  lineNumberStart,
  onChange = noop,

  editorRef,
  monacoRef,
}: RLSCodeEditorProps) => {
  const hasValue = useRef<any>()

  const options: editor.IStandaloneEditorConstructionOptions = {
    tabSize: 2,
    fontSize: 13,
    readOnly,
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    contextmenu: true,
    lineNumbers:
      lineNumberStart !== undefined ? (num) => (num + lineNumberStart).toString() : undefined,
    glyphMargin: undefined,
    lineNumbersMinChars: 4,
    folding: undefined,
    scrollBeyondLastLine: false,
  }

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    if (monacoRef !== undefined) monacoRef.current = monaco

    hasValue.current = editor.createContextKey('hasValue', false)
    const placeholderEl = document.querySelector('.monaco-placeholder') as HTMLElement | null
    if (placeholderEl && placeholder !== undefined) placeholderEl.style.display = 'block'

    editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        editor.executeEdits('source', [
          {
            // @ts-ignore
            identifier: 'add-placeholder',
            range: new monaco.Range(1, 1, 1, 1),
            text: (placeholder ?? '')
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

  const onChangeContent: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)

    const placeholderEl = document.querySelector('.monaco-placeholder') as HTMLElement | null
    if (placeholderEl) {
      if (!value) {
        placeholderEl.style.display = 'block'
      } else {
        placeholderEl.style.display = 'none'
      }
    }

    onChange()
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
        onChange={onChangeContent}
      />
      {placeholder !== undefined && (
        <div
          className="monaco-placeholder absolute top-[0px] left-[57px] text-sm pointer-events-none font-mono [&>div>p]:text-foreground-lighter [&>div>p]:!m-0 tracking-tighter"
          style={{ display: 'none' }}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </>
  )
}

export default RLSCodeEditor
