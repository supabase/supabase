import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { Selection, editor } from 'monaco-editor'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import AskAIWidget from './AskAIWidget'
import InlineWidget from './InlineWidget'

export type IStandaloneCodeEditor = Parameters<OnMount>[0]

export type MonacoEditorProps = {
  id: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  isExecuting: boolean
  autoFocus?: boolean
  executeQuery: () => void
  onOpenAiWidget?: () => void
  onCloseAiWidget?: () => void
}

const MonacoEditor = ({
  id,
  editorRef,
  isExecuting,
  autoFocus = true,
  executeQuery,
  onOpenAiWidget,
  onCloseAiWidget,
}: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const monacoRef = useRef<Monaco | null>(null)
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>()
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false)
  const [aiWidgetSelection, setAiWidgetSelection] = useState<Selection>()

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

    editor.addAction({
      id: 'ask-ai',
      label: 'Ask AI',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyI],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        const selection = editor.getSelection()

        if (selection) {
          setAiWidgetSelection(selection)
          setIsAiWidgetOpen(true)
          onOpenAiWidget?.()
        }
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

  useEffect(() => {
    if (!isAiWidgetOpen) {
      return
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsAiWidgetOpen(false)
        onCloseAiWidget?.()
        editor?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [editor, isAiWidgetOpen, onCloseAiWidget])

  function handleEditorChange(value: string | undefined) {
    if (id && value) snap.setSql(id, value)
  }

  return (
    <>
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
      {editor && isAiWidgetOpen && aiWidgetSelection && (
        <InlineWidget
          editor={editor}
          id="ask-ai"
          afterLineNumber={aiWidgetSelection.endLineNumber}
          heightInLines={6}
        >
          <AskAIWidget />
        </InlineWidget>
      )}
    </>
  )
}

export default MonacoEditor
