import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export type IStandaloneCodeEditor = Parameters<OnMount>[0]

export type MonacoEditorProps = {
  id: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  isExecuting: boolean
  executeQuery: () => void
}

const MonacoEditor = ({ id, editorRef, isExecuting, executeQuery }: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const monacoRef = useRef<Monaco | null>(null)
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const [domNode, setDomNode] = useState<HTMLElement>()

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    if (model !== null) {
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
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
        executeQueryRef.current()
      },
    })

    const domNode = document.createElement('div')

    let viewZoneTop = 0
    let viewZoneHeight = 0

    setDomNode(domNode)

    function layoutOverlayWidget() {
      const layoutInfo = editorRef.current?.getLayoutInfo()

      if (!layoutInfo) {
        return
      }

      console.log({ layoutInfo })

      domNode.style.left = `${layoutInfo.contentLeft}px`
      domNode.style.top = `${viewZoneTop}px`
      domNode.style.width = `${layoutInfo.width}px`
      domNode.style.height = `${viewZoneHeight}px`
    }

    editorRef.current.changeViewZones((accessor) => {
      // add margin above first line
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })

      accessor.addZone({
        afterLineNumber: 1,
        heightInLines: 4,
        domNode: document.createElement('div'),
        onDomNodeTop: (top) => {
          console.log({ top })
          viewZoneTop = top
          layoutOverlayWidget()
        },
        onComputedHeight: (height) => {
          console.log({ height })
          viewZoneHeight = height
          layoutOverlayWidget()
        },
      })

      editorRef.current?.addOverlayWidget({
        getId: function () {
          return 'my.inline.widget'
        },
        getDomNode: function () {
          return domNode
        },
        getPosition: function () {
          return null
        },
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
      {domNode && createPortal(<>My inline widget</>, domNode)}
    </>
  )
}

export default MonacoEditor
