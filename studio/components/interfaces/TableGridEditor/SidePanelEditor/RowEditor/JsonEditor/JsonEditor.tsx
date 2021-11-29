import { FC, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { SidePanel, Typography } from '@supabase/ui'

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
  const [view, setView] = useState('edit')
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
        : 'Hmm, invalid JSON seems to have an invalid structure.'
      toast.error(message)
    } finally {
      resolve()
    }
  }

  function toggleView(option: string) {
    setView(option)
  }

  function onInputChange(value: any) {
    setJsonStr(value ?? '')
  }

  function onToggleClick(option: string) {
    toggleView(option)
  }

  return (
    <SidePanel
      wide
      title={'JSON'}
      visible={visible}
      onCancel={closePanel}
      onConfirm={validateJSON}
      customFooter={<ActionBar closePanel={closePanel} applyFunction={validateJSON} />}
    >
      <TwoOptionToggle
        options={['view', 'edit']}
        activeOption={view}
        borderOverride="border-gray-500"
        onClickOption={onToggleClick}
      />

      <div className="flex-auto flex flex-col mt-4">
        {view === 'edit' ? (
          <Editor column={column} value={jsonStr} onChange={onInputChange} />
        ) : (
          <Viewer column={column} value={jsonStr} />
        )}
      </div>
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

      <div className="w-full h-96 flex-grow border dark:border-dark">
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
