import * as React from 'react'
import { RenderEditCellProps } from 'react-data-grid'

function autoFocusAndSelect(input: HTMLInputElement | null) {
  input?.focus()
  input?.select()
}

export function NumberEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const _value = event.target.value
    if (_value == '') onRowChange({ ...row, [column.key]: null })
    else onRowChange({ ...row, [column.key]: _value })
  }

  function onBlur() {
    onClose(true)
  }

  return (
    <input
      className="sb-grid-number-editor"
      ref={autoFocusAndSelect}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      type="number"
    />
  )
}
