import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { editor } from 'monaco-editor'
import { MutableRefObject, useRef, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { IStandaloneCodeEditor } from './SQLEditor.types'
import { cn } from 'ui'

export type MonacoEditorProps = {
  id: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  isExecuting: boolean
  autoFocus?: boolean
  executeQuery: () => void
  className?: string
}

const MonacoEditor = ({
  id,
  editorRef,
  isExecuting,
  autoFocus = true,
  className,
  executeQuery,
}: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const monacoRef = useRef<Monaco | null>(null)
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>()

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    setEditor(editor)

    const model = editorRef.current.getModel()
    if (model !== null) {
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
    }

    editor.addAction({
      id: 'run-query',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        executeQueryRef.current()
      },
    })

    // add margin above first line
    editorRef.current.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    if (autoFocus) {
      await timeout(500)
      editor.focus()
    }
  }

  function handleEditorChange(value: string | undefined) {
    if (id && value) snap.setSql(id, value)
  }

  return (
    <>
      <Editor
        className={cn(className, 'monaco-editor')}
        theme={'supabase'}
        onMount={handleEditorOnMount}
        onChange={handleEditorChange}
        defaultLanguage="pgsql"
        defaultValue={snippet?.snippet.content.sql}
        path={id}
        options={{
          tabSize: 2,
          fontSize: 13,
          minimap: {
            enabled: false,
          },
          wordWrap: 'on',
          fixedOverflowWidgets: true,
        }}
      />
    </>
  )
}

export default MonacoEditor
