import * as React from 'react'
import { EditorProps } from '@supabase/react-data-grid'

interface SelectEditorProps<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  options: { label: string; value: string }[]
}

export function SelectEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
  options,
}: SelectEditorProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    if (!value || value == '') {
      onRowChange({ ...row, [column.key]: null }, true)
    } else {
      onRowChange({ ...row, [column.key]: value }, true)
    }
  }

  function onBlur() {
    onClose(false)
  }

  return (
    <select
      className="sb-grid-select-editor bg-scale-400 text-grid p-0 px-3"
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      autoFocus
    >
      <option value={''}>[null]</option>
      {options.map(({ label, value }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
