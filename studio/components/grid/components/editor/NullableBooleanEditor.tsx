import React, { useEffect } from 'react'
import { EditorProps } from '@supabase/react-data-grid'
import { Button, IconX } from 'ui'

export function NullableBooleanEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: EditorProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as boolean | null

  useEffect(() => {
    // if value is null, set it to false on initial render
    if (value === null) {
      onRowChange({ ...row, [column.key]: false })
    }
  }, [])

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    onRowChange({ ...row, [column.key]: event.target.checked })
  }

  function onBlur() {
    onClose(true)
  }

  function onClear() {
    onRowChange({ ...row, [column.key]: null }, true)
  }

  return (
    <div className="sb-grid-checkbox-editor">
      <input
        className="sb-grid-checkbox-editor__input"
        checked={value === null ? false : value}
        onChange={onChange}
        onBlur={onBlur}
        type="checkbox"
        style={{ margin: 'auto' }}
      />
      <Button
        type="text"
        title="Clear"
        icon={<IconX size="tiny" strokeWidth={2} />}
        onClick={onClear}
        style={{ padding: '3px', margin: 'auto 5px auto auto' }}
      />
    </div>
  )
}
