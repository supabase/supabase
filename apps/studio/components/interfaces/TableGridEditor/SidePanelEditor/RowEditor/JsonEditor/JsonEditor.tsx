import { useEffect, useState } from 'react'
import { SidePanel } from 'ui'

import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useStore } from 'hooks'
import { minifyJSON, prettifyJSON, tryParseJson } from 'lib/helpers'
import ActionBar from '../../ActionBar'
import DrilldownViewer from './DrilldownViewer'
import JsonEditor from './JsonCodeEditor'

interface JsonEditProps {
  column: string
  jsonString: string
  visible: boolean
  backButtonLabel?: string
  applyButtonLabel?: string
  readOnly?: boolean
  closePanel: () => void
  onSaveJSON: (value: string | number | null) => void
}

const JsonEdit = ({
  column,
  jsonString,
  visible,
  backButtonLabel,
  applyButtonLabel,
  readOnly = false,
  closePanel,
  onSaveJSON,
}: JsonEditProps) => {
  const { ui } = useStore()
  const [view, setView] = useState<'edit' | 'view'>('edit')
  const [jsonStr, setJsonStr] = useState('')

  useEffect(() => {
    if (visible) {
      const temp = prettifyJSON(jsonString)
      setJsonStr(temp)
    }
  }, [visible])

  const validateJSON = async (resolve: () => void) => {
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

  function onInputChange(value: string | undefined) {
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
              {readOnly ? 'Viewing' : 'Editing'} JSON Field: <code>{column}</code>
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
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={closePanel}
          backButtonLabel={backButtonLabel}
          applyButtonLabel={applyButtonLabel}
          applyFunction={readOnly ? undefined : validateJSON}
        />
      }
    >
      <div className="py-4">
        <SidePanel.Content>
          <div className="mt-4 flex flex-auto flex-col space-y-4">
            {view === 'edit' ? (
              <div className="h-[500px] w-full flex-grow border dark:border-dark">
                <JsonEditor
                  key={jsonString}
                  readOnly={readOnly}
                  onInputChange={onInputChange}
                  value={jsonStr.toString()}
                />
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
