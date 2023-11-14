import Editor, { OnChange, OnMount } from '@monaco-editor/react'
import { noop } from 'lodash'

// [Joshen] Should just use CodeEditor instead of declaring Editor here so that all the mount logic is consistent

interface JsonEditorProps {
  value: string
  readOnly?: boolean
  onInputChange: OnChange
}

const JsonEditor = ({ value = '', readOnly = false, onInputChange = noop }: JsonEditorProps) => {
  const onMount: OnMount = (editor) => {
    editor.changeViewZones((accessor) => {
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
      value={value}
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
