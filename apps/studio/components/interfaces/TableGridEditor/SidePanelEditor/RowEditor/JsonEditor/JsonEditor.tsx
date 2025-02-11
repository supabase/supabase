import * as Tooltip from '@radix-ui/react-tooltip'
import { AlignLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { MAX_CHARACTERS } from 'data/table-rows/table-rows-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { minifyJSON, prettifyJSON, removeJSONTrailingComma, tryParseJson } from 'lib/helpers'
import { Button, SidePanel, cn } from 'ui'
import ActionBar from '../../ActionBar'
import { isValueTruncated } from '../RowEditor.utils'
import { DrilldownViewer } from './DrilldownViewer'
import JsonCodeEditor from './JsonCodeEditor'

interface JsonEditProps {
  row?: { [key: string]: any }
  column: string
  visible: boolean
  backButtonLabel?: string
  applyButtonLabel?: string
  readOnly?: boolean
  closePanel: () => void
  onSaveJSON: (value: string | number | null, resolve: () => void) => void
}

const JsonEdit = ({
  row,
  column,
  visible,
  backButtonLabel,
  applyButtonLabel,
  readOnly = false,
  closePanel,
  onSaveJSON,
}: JsonEditProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const project = useSelectedProject()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [view, setView] = useState<'edit' | 'view'>('edit')
  const [jsonStr, setJsonStr] = useState('')
  // sometimes the value is a JSON object if it was truncated, then fully loaded from the grid.
  const value = row?.[column as keyof typeof row] as unknown
  const jsonString = typeof value === 'object' ? JSON.stringify(value) : (value as string)
  const isTruncated = isValueTruncated(jsonString)

  const { mutate: getCellValue, isLoading, isSuccess, reset } = useGetCellValueMutation()

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

  const prettify = () => {
    const res = prettifyJSON(jsonStr)
    setJsonStr(res)
  }

  const loadFullValue = () => {
    if (
      selectedTable === undefined ||
      project === undefined ||
      row === undefined ||
      !isTableLike(selectedTable)
    )
      return
    if (selectedTable.primary_keys.length === 0) {
      return toast('Unable to load value as table has no primary keys')
    }

    const pkMatch = selectedTable.primary_keys.reduce((a, b) => {
      return { ...a, [b.name]: (row as any)[b.name] }
    }, {})

    getCellValue(
      {
        table: { schema: selectedTable.schema, name: selectedTable.name },
        column: column,
        pkMatch,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      },
      {
        onSuccess: (data) => {
          setJsonStr(JSON.stringify(data))
        },
      }
    )
  }

  useEffect(() => {
    if (visible) {
      const temp = prettifyJSON(jsonString)
      setJsonStr(temp)
    }
  }, [visible])

  // reset the mutation when the panel closes. Fixes an issue where the value is truncated if you close and reopen the
  // panel again
  const onClose = useCallback(() => {
    reset()
    closePanel()
  }, [reset])

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
          {(!isTruncated || (isTruncated && isSuccess)) && (
            <div className="flex items-center gap-x-2">
              {view === 'edit' && (
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger asChild>
                    <Button
                      type="default"
                      icon={<AlignLeft />}
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
          )}
        </div>
      }
      visible={visible}
      onCancel={onClose}
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={onClose}
          backButtonLabel={backButtonLabel}
          applyButtonLabel={applyButtonLabel}
          applyFunction={readOnly ? undefined : validateJSON}
        />
      }
    >
      <div className="flex flex-auto h-full flex-col gap-y-4 relative">
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
        {isTruncated && !isSuccess && (
          <div
            className={cn(
              'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
              'text-sm w-full h-full px-2 text-center',
              'bg-default/80 backdrop-blur-[1.5px]'
            )}
          >
            <div className="flex flex-col gap-y-1 w-80">
              <p>JSON value is larger than {MAX_CHARACTERS.toLocaleString()} characters</p>
              <p className="text-foreground-light">
                You may try to render the entire JSON value, but your browser may run into
                performance issues
              </p>
            </div>
            <Button type="default" loading={isLoading} onClick={loadFullValue}>
              Load full JSON data
            </Button>
          </div>
        )}
      </div>
    </SidePanel>
  )
}

export default JsonEdit
