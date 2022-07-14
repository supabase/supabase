import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { useEffect, useRef } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export type MonacoEditorProps = {
  id: string
  executeQuery?: (overrideSql?: string) => void
}

const MonacoEditor = ({ id, executeQuery }: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

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

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

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
        const selectedValue = (editorRef?.current)
          .getModel()
          .getValueInRange(editorRef?.current?.getSelection())

        executeQueryRef.current?.(selectedValue || undefined)
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

  // changes are stored in debouncer before running persistData()
  // let debounceUpdateSqlSnippet = debounce((value) => updateSqlSnippet(value), 1500)
  function handleEditorChange(value: string | undefined) {
    // update sqlEditorState with new value immediately
    // this is so any SQL run will be whatever is currently in monaco editor
    if (id && value) {
      snap.setSql(id, value)
    }
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
