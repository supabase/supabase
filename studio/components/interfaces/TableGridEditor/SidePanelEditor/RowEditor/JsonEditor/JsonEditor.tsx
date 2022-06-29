import { FC, useState, useEffect } from 'react'
import { SidePanel, Typography } from '@supabase/ui'

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
  onSaveJSON: (value: string) => void
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
      header={'JSON'}
      visible={visible}
      onCancel={closePanel}
      customFooter={<ActionBar closePanel={closePanel} applyFunction={validateJSON} />}
    >
      <SidePanel.Content>
        <TwoOptionToggle
          options={['view', 'edit']}
          activeOption={view}
          borderOverride="border-gray-500"
          onClickOption={onToggleClick}
        />

        <div className="mt-4 flex flex-auto flex-col space-y-2">
          {view === 'edit' ? (
            <Editor column={column} value={jsonStr} onChange={onInputChange} />
          ) : (
            <Viewer column={column} value={jsonStr} />
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default JsonEdit

interface EditorProps {
  column: string
  value: string
  onChange: (value: any) => void
}

const Editor: FC<EditorProps> = ({ column, value, onChange }) => {
  return (
    <>
      <Typography.Title level={4}>Edit JSON Field: {column}</Typography.Title>

      <div className="dark:border-dark h-96 w-full flex-grow border">
        <JsonEditor onInputChange={onChange} defaultValue={value} />
      </div>
    </>
  )
}

type ViewerProps = {
  column: string
  value: string
}

const Viewer: FC<ViewerProps> = ({ column, value }) => {
  const json = tryParseJson(value)
  return (
    <>
      <Typography.Title level={4}>Viewing JSON Field: {column}</Typography.Title>
      <DrilldownViewer jsonData={json} />
    </>
  )
}
