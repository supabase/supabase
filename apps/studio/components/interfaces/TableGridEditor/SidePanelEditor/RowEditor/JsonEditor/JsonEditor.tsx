import { useEffect, useState } from 'react'
import { Button, IconAlignLeft, IconAlignRight, SidePanel } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useStore } from 'hooks'
import { minifyJSON, prettifyJSON, tryParseJson } from 'lib/helpers'
import ActionBar from '../../ActionBar'
import DrilldownViewer from './DrilldownViewer'
import JsonCodeEditor from './JsonCodeEditor'

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

  function prettify() {
    const res = prettifyJSON(jsonStr)
    setJsonStr(res)
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
          <div className="flex items-center gap-x-2">
            {view === 'edit' && (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    type="default"
                    icon={<IconAlignLeft />}
                    className="px-1"
                    onClick={() => prettify()}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">Prettify JSON</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
            <TwoOptionToggle
              options={['view', 'edit']}
              activeOption={view}
              borderOverride="border-gray-500"
              onClickOption={onToggleClick}
            />
          </div>
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
      <div className="flex flex-auto h-full flex-col space-y-4">
        {view === 'edit' ? (
          <div className="w-full h-full flex-grow">
            <JsonCodeEditor
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
    </SidePanel>
  )
}

export default JsonEdit
