import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { useEffect, useRef } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export type MonacoEditorProps = {
  id: string
  isExecuting: boolean
  executeQuery: (overrideSql?: string) => void
}

const MonacoEditor = ({ id, isExecuting, executeQuery }: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    monacoRef.current.editor.setModelMarkers(model, 'owner', [])
  }, [])

  useEffect(() => {
    if (editorRef.current) {
      // add margin above first line
      editorRef.current?.changeViewZones((accessor: any) => {
        accessor.addZone({
          afterLineNumber: 0,
          heightInPx: 4,
          domNode: document.createElement('div'),
        })
      })
    }
  }, [])

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.addAction({
      id: 'supabase',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        if (isExecuting) return

        const selectedValue = (editorRef?.current)
          .getModel()
          .getValueInRange(editorRef?.current?.getSelection())

        executeQueryRef.current?.(selectedValue || editorRef?.current?.getValue())
      },
    })

    // add margin above first line
    editor.changeViewZones((accessor: any) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    // when editor did mount, it will need a delay before focus() works properly
    await timeout(500)
    editor.focus()
  }

  function handleEditorChange(value: string | undefined) {
    if (id && value) snap.setSql(id, value)
  }

  return (
    <Editor
      className="monaco-editor"
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
  )
}

export default MonacoEditor
