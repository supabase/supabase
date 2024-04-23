import * as Tooltip from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { Button, IconAlignLeft, SidePanel } from 'ui'

import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { minifyJSON, prettifyJSON, tryParseJson, removeJSONTrailingComma } from 'lib/helpers'
import toast from 'react-hot-toast'
import ActionBar from '../../ActionBar'
import { DrilldownViewer } from './DrilldownViewer'
import JsonCodeEditor from './JsonCodeEditor'

interface JsonEditProps {
  column: string
  jsonString: string
  visible: boolean
  backButtonLabel?: string
  applyButtonLabel?: string
  readOnly?: boolean
  closePanel: () => void
  onSaveJSON: (value: string | number | null, resolve: () => void) => void
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
      const newJsonStr = removeJSONTrailingComma(jsonStr)
      const minifiedJSON = minifyJSON(newJsonStr)
      if (onSaveJSON) onSaveJSON(minifiedJSON, resolve)
    } catch (error: any) {
      resolve()
      toast.error('JSON seems to have an invalid structure.')
    }
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
              borderOverride="border-muted"
              onClickOption={setView}
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
              onInputChange={(val) => setJsonStr(val ?? '')}
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
