import * as Tooltip from '@radix-ui/react-tooltip'
import { RenderEditCellProps } from 'react-data-grid'
import { useCallback, useState } from 'react'
import { IconMaximize, Popover } from 'ui'

import { BlockKeys, MonacoEditor, NullValue } from 'components/grid/components/common'
import { useTrackedState } from 'components/grid/store'
import { tryParseJson } from 'lib/helpers'
import { isNil } from 'lodash'

interface JsonEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  isEditable: boolean
  onExpandEditor: (column: string, row: TRow) => void
}

export const JsonEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isEditable = true,
  onRowChange,
  onExpandEditor,
}: JsonEditorProps<TRow, TSummaryRow>) => {
  const state = useTrackedState()

  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown
  const jsonString = prettifyJSON(!isNil(initialValue) ? JSON.stringify(initialValue) : '')

  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const [value, setValue] = useState<string | null>(jsonString)

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback((newValue: string | null) => {
    if (newValue !== value) commitChange(newValue)
  }, [])

  const onChange = (_value: string | undefined) => {
    if (!isEditable) return

    if (!_value || _value == '') setValue(null)
    else setValue(_value)
  }

  const onSelectExpand = () => {
    cancelChanges()
    onExpandEditor(column.key, {
      ...row,
      [column.key]: tryParseJson(value) || (row as any)[column.key],
    })
  }

  const commitChange = (newValue: string | null) => {
    if (!isEditable) return

    if (!newValue) {
      onRowChange({ ...row, [column.key]: null }, true)
      setIsPopoverOpen(false)
    } else if (verifyJSON(newValue)) {
      const jsonValue = JSON.parse(newValue)
      onRowChange({ ...row, [column.key]: jsonValue }, true)
      setIsPopoverOpen(false)
    } else {
      const { onError } = state
      if (onError) onError(Error('Please enter a valid JSON'))
    }
  }

  return (
    <Popover
      open={isPopoverOpen}
      side="bottom"
      align="start"
      sideOffset={-35}
      className="rounded-none"
      overlay={
        <BlockKeys value={value} onEscape={cancelChanges} onEnter={saveChanges}>
          <MonacoEditor
            width={`${gridColumn?.width || column.width}px`}
            value={value ?? ''}
            language="json"
            readOnly={!isEditable}
            onChange={onChange}
          />
          <div className="flex items-start justify-between p-2 bg-surface-200 space-x-2">
            {isEditable ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="px-1.5 py-[2.5px] rounded bg-selection border border-strong flex items-center justify-center">
                    <span className="text-[10px]">⏎</span>
                  </div>
                  <p className="text-xs text-foreground-light">Save changes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-1 py-[2.5px] rounded bg-selection border border-strong flex items-center justify-center">
                    <span className="text-[10px]">Esc</span>
                  </div>
                  <p className="text-xs text-foreground-light">Cancel changes</p>
                </div>
              </div>
            ) : (
              <div />
            )}
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <div
                  className={[
                    'border border-strong rounded p-1 flex items-center justify-center',
                    'transition cursor-pointer bg-selection hover:bg-border-strong',
                  ].join(' ')}
                  onClick={() => onSelectExpand()}
                >
                  <IconMaximize size={12} strokeWidth={2} />
                </div>
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
                    <span className="text-xs text-foreground">Expand editor</span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </BlockKeys>
      }
    >
      <div
        className={`${
          !!value && jsonString.trim().length == 0 ? 'sb-grid-fill-container' : ''
        } sb-grid-json-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null || value === '' ? <NullValue /> : jsonString}
      </div>
    </Popover>
  )
}

export const prettifyJSON = (value: string) => {
  if (value.length > 0) {
    try {
      return JSON.stringify(JSON.parse(value), undefined, 2)
    } catch (err) {
      // dont need to throw error, just return text value
      // Users have to fix format if they want to save
      return value
    }
  } else {
    return value
  }
}

export const minifyJSON = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value))
  } catch (err) {
    throw err
  }
}

export const verifyJSON = (value: string) => {
  try {
    JSON.parse(value)
    return true
  } catch (err) {
    return false
  }
}
