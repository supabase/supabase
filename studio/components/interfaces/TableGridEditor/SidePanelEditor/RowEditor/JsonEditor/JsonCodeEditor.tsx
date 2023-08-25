import Editor from '@monaco-editor/react'
import { noop } from 'lodash'
import { useRef } from 'react'

// [Joshen] Should just use CodeEditor instead of declaring Editor here so that all the mount logic is consistent

interface JsonEditorProps {
  queryId?: string
  defaultValue: string
  readOnly?: boolean
  onInputChange: (value: any) => void
}

const JsonEditor = ({
  queryId = '',
  defaultValue = '',
  readOnly = false,
  onInputChange = noop,
}: JsonEditorProps) => {
  const editorRef = useRef()

  const onMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Add margin above first line
    editor.changeViewZones((accessor: any) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })
  }

  const Loading = () => <h4>Loading</h4>

  return (
    <Editor
      className="monaco-editor"
      theme="supabase"
      defaultLanguage="json"
      defaultValue={defaultValue}
      path={queryId}
      loading={<Loading />}
      options={{
        readOnly,
        tabSize: 2,
        fontSize: 13,
        minimap: {
          enabled: false,
        },
        wordWrap: 'on',
        fixedOverflowWidgets: true,
      }}
      onMount={onMount}
      onChange={onInputChange}
    />
  )
}

export default JsonEditor
