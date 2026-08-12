'use client'

import Editor, { type EditorProps, type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useRef, type RefObject } from 'react'
import { cn } from 'ui'

const DEFAULT_OPTIONS: MonacoEditor.IStandaloneEditorConstructionOptions = {
  ariaLabel: 'SQL editor',
  contextmenu: true,
  fixedOverflowWidgets: true,
  fontSize: 13,
  minimap: { enabled: false },
  padding: { top: 8, bottom: 8 },
  scrollBeyondLastLine: false,
  tabSize: 2,
  wordWrap: 'on',
}

export type QuerySqlEditorProps = {
  value: string
  onValueChange?: (value: string) => void
  /** Called with the selected SQL, or the whole document when there is no selection. */
  onExecute?: (sql: string) => void
  id?: string
  readOnly?: boolean
  autoFocus?: boolean
  hideLineNumbers?: boolean
  ariaLabel?: string
  className?: string
  editorClassName?: string
  theme?: EditorProps['theme']
  loading?: EditorProps['loading']
  options?: EditorProps['options']
  beforeMount?: EditorProps['beforeMount']
  onMount?: OnMount
  editorRef?: RefObject<MonacoEditor.IStandaloneCodeEditor | null>
  monacoRef?: RefObject<Monaco | null>
}

/**
 * Controlled, source-agnostic SQL editor. Query execution is exposed only as
 * a callback; resolving a source and persisting SQL remain caller concerns.
 */
const QuerySqlEditor = ({
  value,
  onValueChange,
  onExecute,
  id,
  readOnly = false,
  autoFocus = false,
  hideLineNumbers = false,
  ariaLabel = 'SQL editor',
  className,
  editorClassName,
  theme,
  loading,
  options,
  beforeMount,
  onMount,
  editorRef,
  monacoRef,
}: QuerySqlEditorProps) => {
  const onExecuteRef = useRef(onExecute)
  onExecuteRef.current = onExecute

  const handleMount: OnMount = (editor, monaco) => {
    if (editorRef) editorRef.current = editor
    if (monacoRef) monacoRef.current = monaco

    if (onExecuteRef.current) {
      editor.addAction({
        id: `run-query${id ? `-${id}` : ''}`,
        label: 'Run query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: 'operation',
        contextMenuOrder: 0,
        run: () => {
          const selection = editor.getSelection()
          const selectedSql = selection
            ? editor.getModel()?.getValueInRange(selection).trim()
            : undefined

          onExecuteRef.current?.(selectedSql || editor.getValue())
        },
      })
    }

    if (autoFocus) editor.focus()
    onMount?.(editor, monaco)
  }

  const mergedOptions: EditorProps['options'] = {
    ...DEFAULT_OPTIONS,
    ariaLabel,
    domReadOnly: readOnly,
    readOnly,
    lineNumbers: hideLineNumbers ? 'off' : 'on',
    glyphMargin: hideLineNumbers ? false : undefined,
    lineNumbersMinChars: hideLineNumbers ? 0 : 3,
    folding: hideLineNumbers ? false : undefined,
    ...options,
    minimap: {
      ...DEFAULT_OPTIONS.minimap,
      ...options?.minimap,
    },
  }

  return (
    <div
      data-slot="query-sql-editor"
      data-read-only={readOnly || undefined}
      className={cn('h-full min-h-0 w-full overflow-hidden', className)}
    >
      <Editor
        path={id}
        value={value}
        language="pgsql"
        theme={theme}
        loading={loading}
        height="100%"
        width="100%"
        className={cn('h-full', editorClassName)}
        options={mergedOptions}
        beforeMount={beforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onValueChange?.(nextValue ?? '')}
      />
    </div>
  )
}
QuerySqlEditor.displayName = 'QuerySqlEditor'

export { QuerySqlEditor }
