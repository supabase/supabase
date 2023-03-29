import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { timeout } from 'lib/helpers'
import { useStore } from 'hooks'

const ViewDefinition = () => {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  const { ui } = useStore()
  const { isDarkTheme } = ui

  const handleEditorOnMount = async (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

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
    editor?.focus()
  }

  return (
    <div className="flex-grow overflow-y-auto border-t border-scale-400">
      <Editor
        className="monaco-editor"
        theme={isDarkTheme ? 'vs-dark' : 'vs'}
        onMount={handleEditorOnMount}
        defaultLanguage="pgsql"
        defaultValue={'Hello'}
        path={''}
        options={{
          domReadOnly: true,
          tabSize: 2,
          fontSize: 13,
          minimap: { enabled: false },
          wordWrap: 'on',
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  )
}

export default ViewDefinition
