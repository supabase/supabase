import { useState, useCallback } from 'react'
import { EditorProps } from '@supabase/react-data-grid'
import { useTrackedState } from '../../store'
import { BlockKeys, MonacoEditor, NullValue, EmptyValue } from '../common'
import { Button, Popover } from 'ui'

export const TextEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  isEditable,
  onRowChange,
}: EditorProps<TRow, TSummaryRow> & { isNullable?: boolean; isEditable?: boolean }) => {
  const state = useTrackedState()
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown as string
  const [value, setValue] = useState<string | null>(initialValue)

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback((newValue: string | null) => {
    if (isEditable) onRowChange({ ...row, [column.key]: newValue }, true)
    setIsPopoverOpen(false)
  }, [])

  function onChange(_value: string | undefined) {
    if (!isEditable) return

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
            readOnly={!isEditable}
            onChange={onChange}
          />
          {isEditable && (
            <div className="flex items-start justify-between p-2 bg-scale-400 space-x-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="px-1.5 py-[2.5px] rounded bg-scale-600 border border-scale-700 flex items-center justify-center">
                    <span className="text-[10px]">⏎</span>
                  </div>
                  <p className="text-xs text-scale-1100">Save changes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-1 py-[2.5px] rounded bg-scale-600 border border-scale-700 flex items-center justify-center">
                    <span className="text-[10px]">Esc</span>
                  </div>
                  <p className="text-xs text-scale-1100">Cancel changes</p>
                </div>
              </div>
              <div className="space-y-1">
                {isNullable && (
                  <Button
                    asChild
                    htmlType="button"
                    type="default"
                    size="tiny"
                    onClick={() => saveChanges(null)}
                  >
                    <div>Set to NULL</div>
                  </Button>
                )}
              </div>
            </div>
          )}
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
