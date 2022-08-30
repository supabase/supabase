import * as React from 'react'
import { EditorProps } from '@supabase/react-data-grid'

export function BooleanEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: EditorProps<TRow, TSummaryRow>) {
  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    onRowChange({ ...row, [column.key]: event.target.checked })
  }

  function onBlur() {
    onClose(true)
  }

  return (
    <div className="sb-grid-checkbox-editor">
      <input
        className="sb-grid-checkbox-editor__input"
        checked={row[column.key as keyof TRow] as unknown as boolean}
        onChange={onChange}
        onBlur={onBlur}
        type="checkbox"
        style={{ margin: 'auto' }}
      />
    </div>
  )
}
