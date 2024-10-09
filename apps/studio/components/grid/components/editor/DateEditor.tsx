import { ChangeEvent, useEffect, useRef } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'

export function DateEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<TRow, TSummaryRow>) {
  const ref = useRef<HTMLInputElement>(null)
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    let _value = event.target.value
    if (_value == '') onRowChange({ ...row, [column.key]: null })
    else onRowChange({ ...row, [column.key]: _value })
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
      ref.current.showPicker()
    }
  }, [])

  return (
    <input
      ref={ref}
      type="date"
      className="h-full w-full px-2 text-sm"
      value={value ?? ''}
      onChange={onChange}
      onBlur={() => onClose(true)}
    />
  )
}
