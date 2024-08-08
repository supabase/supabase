import * as React from 'react'
import type { RenderEditCellProps } from 'react-data-grid'

function autoFocusAndSelect(input: HTMLInputElement | null) {
  input?.focus()
  input?.select()
}

export function DateEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    let _value = event.target.value
    if (_value == '') onRowChange({ ...row, [column.key]: null })
    else onRowChange({ ...row, [column.key]: _value })
  }

  return (
    <input
      className="sb-grid-date-editor"
      ref={autoFocusAndSelect}
      value={value ?? ''}
      onChange={onChange}
      onBlur={() => onClose(true)}
      type="date"
    />
  )
}
