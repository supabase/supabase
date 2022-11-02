import { Popover } from 'ui'
import { useState, useCallback } from 'react'
import { EditorProps } from '@supabase/react-data-grid'

import { useTrackedState } from 'components/grid/store'
import { BlockKeys, MonacoEditor, NullValue } from 'components/grid/components/common'

export function JsonEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
}: EditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState()

  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown
  const jsonString = prettifyJSON(initialValue ? JSON.stringify(initialValue) : '')

  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const [value, setValue] = useState<string | null>(jsonString)

  const cancelChanges = useCallback(() => {
    onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback((newValue: string | null) => {
    commitChange(newValue)
  }, [])

  function onChange(_value: string | undefined) {
    if (!_value || _value == '') setValue(null)
    else setValue(_value)
  }

  function commitChange(newValue: string | null) {
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
            onChange={onChange}
          />
          <div className="flex items-center justify-end p-2 bg-scale-400 space-x-2">
            <p className="text-xs text-scale-1100">Save changes</p>
            <code className="text-xs">⏎</code>
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
