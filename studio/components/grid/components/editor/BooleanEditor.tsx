import * as React from 'react'
import { EditorProps } from '@supabase/react-data-grid'
import { Toggle } from 'ui'

export function BooleanEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: EditorProps<TRow, TSummaryRow>) {
  const onBlur = () => onClose(true)
  const onChange = (value: boolean) => onRowChange({ ...row, [column.key]: value })

  return (
    <div className="sb-grid-checkbox-editor flex items-center">
      <Toggle
        // @ts-ignore
        onChange={onChange}
        onBlur={onBlur}
        checked={row[column.key as keyof TRow] as unknown as boolean}
        className="mx-auto translate-y-[1px]"
      />
    </div>
  )
}
