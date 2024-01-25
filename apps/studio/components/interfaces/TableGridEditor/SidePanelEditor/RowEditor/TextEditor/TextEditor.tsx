import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import { IconLoader, SidePanel } from 'ui'

import { useTableEditorStateSnapshot } from 'state/table-editor'
import ActionBar from '../../ActionBar'

interface TextEditorProps {
  visible: boolean
  readOnly?: boolean
  closePanel: () => void
  onSaveField: (value: string, resolve: () => void) => void
}

export const TextEditor = ({
  visible,
  readOnly = false,
  closePanel,
  onSaveField,
}: TextEditorProps) => {
  const [strValue, setStrValue] = useState('')
  const snap = useTableEditorStateSnapshot()
  const column = (snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.column) ?? ''
  const row = (snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.row) ?? {}
  const value = row[column as keyof typeof row] as unknown as string

  useEffect(() => {
    if (visible) {
      setStrValue(value)
    }
  }, [visible])

  const saveValue = (resolve: () => void) => {
    if (onSaveField) onSaveField(strValue, resolve)
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={() => closePanel()}
      header={
        <p>
          {readOnly ? 'Viewing' : 'Editing'} value of: <code>{column}</code>
        </p>
      }
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={closePanel}
          backButtonLabel="Cancel"
          applyButtonLabel="Save value"
          applyFunction={readOnly ? undefined : saveValue}
        />
      }
    >
      <div className="flex flex-auto h-full flex-col space-y-4">
        <div className="w-full h-full flex-grow">
          <Editor
            key={value}
            theme="supabase"
            className="monaco-editor"
            defaultLanguage="markdown"
            value={strValue}
            loading={<IconLoader className="animate-spin" strokeWidth={2} size={20} />}
            options={{
              readOnly,
              tabSize: 2,
              fontSize: 13,
              minimap: {
                enabled: false,
              },
              wordWrap: 'on',
              fixedOverflowWidgets: true,
              lineNumbersMinChars: 4,
            }}
            onMount={(editor) => {
              editor.changeViewZones((accessor) => {
                accessor.addZone({
                  afterLineNumber: 0,
                  heightInPx: 4,
                  domNode: document.createElement('div'),
                })
              })
              editor.focus()
            }}
            onChange={(val) => setStrValue(val ?? '')}
          />
        </div>
      </div>
    </SidePanel>
  )
}
