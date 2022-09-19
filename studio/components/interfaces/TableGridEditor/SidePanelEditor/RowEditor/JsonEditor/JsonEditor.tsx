import { FC, useState, useEffect } from 'react'
import { SidePanel } from 'ui'

import { useStore } from 'hooks'
import JsonEditor from './JsonCodeEditor'
import TwoOptionToggle from './TwoOptionToggle'
import DrilldownViewer from './DrilldownViewer'
import ActionBar from '../../ActionBar'
import { minifyJSON, prettifyJSON, tryParseJson } from 'lib/helpers'

type JsonEditProps = {
  column: string
  jsonString: string
  visible: boolean
  closePanel: () => void
  onSaveJSON: (value: string | number) => void
}

const JsonEdit: FC<JsonEditProps> = ({ column, jsonString, visible, closePanel, onSaveJSON }) => {
  const { ui } = useStore()
  const [view, setView] = useState<'edit' | 'view'>('edit')
  const [jsonStr, setJsonStr] = useState('')

  useEffect(() => {
    const temp = prettifyJSON(jsonString)
    setJsonStr(temp)
  }, [jsonString])

  function validateJSON(resolve: () => void) {
    try {
      const minifiedJSON = minifyJSON(jsonStr)
      if (onSaveJSON) onSaveJSON(minifiedJSON)
    } catch (error: any) {
      const message = error.message
        ? `Error: ${error.message}`
        : 'JSON seems to have an invalid structure.'
      ui.setNotification({ category: 'error', message, duration: 4000 })
    } finally {
      resolve()
    }
  }

  function onInputChange(value: any) {
    setJsonStr(value ?? '')
  }

  function onToggleClick(option: 'edit' | 'view') {
    setView(option)
  }

  return (
    <SidePanel
      size="large"
      header={
        <div className="flex items-center justify-between">
          {view === 'edit' ? (
            <p>
              Editing JSON Field: <code>{column}</code>
            </p>
          ) : (
            <p>
              Viewing JSON Field: <code>{column}</code>
            </p>
          )}
          <TwoOptionToggle
            options={['view', 'edit']}
            activeOption={view}
            borderOverride="border-gray-500"
            onClickOption={onToggleClick}
          />
        </div>
      }
      visible={visible}
      onCancel={closePanel}
      customFooter={<ActionBar closePanel={closePanel} applyFunction={validateJSON} />}
    >
      <div className="py-4">
        <SidePanel.Content>
          <div className="mt-4 flex flex-auto flex-col space-y-4">
            {view === 'edit' ? (
              <div className="h-[500px] w-full flex-grow border dark:border-dark">
                <JsonEditor onInputChange={onInputChange} defaultValue={jsonStr.toString()} />
              </div>
            ) : (
              <DrilldownViewer jsonData={tryParseJson(jsonStr)} />
            )}
          </div>
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default JsonEdit
