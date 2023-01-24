import { Select } from 'ui'
import { EditorProps } from '@supabase/react-data-grid'

import { useTrackedState } from 'components/grid/store'

interface SelectEditorProps<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  options: { label: string; _value: string }[]
}

export function SelectEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
  options,
}: SelectEditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState()
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)

  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: any) {
    debugger
    if (!event.target.value || event.target.value == '') {
      onRowChange({ ...row, [column.key]: null }, true)
    } else {
      onRowChange({ ...row, [column.key]: event.target.value }, true)
    }
  }

  function onBlur() {
    onClose(false)
  }

  return (
    <Select
      autoFocus
      id="select-editor"
      name="select-editor"
      size="small"
      defaultValue={value ?? ''}
      className="sb-grid-select-editor !gap-2"
      style={{ width: `${gridColumn?.width || column.width}px` }}
      // @ts-ignore
      onChange={onChange}
      onBlur={onBlur}
    >
      <Select.Option value="">NULL</Select.Option>
      {options.map(({ label, _value }) => (
        <Select.Option key={_value} value={_value} selected={_value === value}>
          {label}
        </Select.Option>
      ))}
    </Select>
  )
}
