import remarkGfm from 'remark-gfm'
import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import { IconLoader, SidePanel } from 'ui'

import { useTableEditorStateSnapshot } from 'state/table-editor'
import ActionBar from '../ActionBar'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { Markdown } from 'components/interfaces/Markdown'

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
  const [view, setView] = useState<'edit' | 'view'>('edit')

  const snap = useTableEditorStateSnapshot()
  const column = (snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.column) ?? ''
  const row = (snap.sidePanel?.type === 'cell' && snap.sidePanel.value?.row) ?? {}
  const value = row[column as keyof typeof row] as unknown as string

  useEffect(() => {
    if (visible) {
      setView('edit')
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
        <div className="flex items-center justify-between">
          <p>
            {readOnly ? 'Viewing' : 'Editing'} value of: <code>{column}</code>
          </p>
          <TwoOptionToggle
            options={['view', 'edit']}
            activeOption={view}
            borderOverride="border-muted"
            onClickOption={setView}
          />
        </div>
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
        {view === 'edit' ? (
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
        ) : (
          <SidePanel.Content className="py-4 bg-default flex-grow">
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="bg-default markdown-body"
              content={strValue}
            />
          </SidePanel.Content>
        )}
      </div>
    </SidePanel>
  )
}
