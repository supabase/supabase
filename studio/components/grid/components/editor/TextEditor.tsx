import { useState, useCallback } from 'react'
import { EditorProps } from '@supabase/react-data-grid'
import { useTrackedState } from '../../store'
import { BlockKeys, MonacoEditor, NullValue, EmptyValue } from '../common'
import { Popover } from 'ui'

export function TextEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
}: EditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState()
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown as string
  const [value, setValue] = useState<string | null>(initialValue)

  const cancelChanges = useCallback(() => {
    onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback((newValue: string | null) => {
    onRowChange({ ...row, [column.key]: newValue }, true)
    setIsPopoverOpen(false)
  }, [])

  function onChange(_value: string | undefined) {
    if (!_value) setValue('')
    else setValue(_value)
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
          !!value && value.trim().length == 0 ? 'sb-grid-fill-container' : ''
        } sb-grid-text-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null ? <NullValue /> : value === '' ? <EmptyValue /> : value}
      </div>
    </Popover>
  )
}
