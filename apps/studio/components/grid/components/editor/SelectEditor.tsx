import type { RenderEditCellProps } from 'react-data-grid'
import { Select } from 'ui'

interface SelectEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  isNullable?: boolean
  options: { label: string; _value: string }[]
}

export function SelectEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
  options,
  isNullable,
}: SelectEditorProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: any) {
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
      style={{ width: `${column.width}px` }}
      // @ts-ignore
      onChange={onChange}
      onBlur={onBlur}
    >
      {isNullable && <Select.Option value="">NULL</Select.Option>}
      {options.map(({ label, _value }) => (
        <Select.Option key={_value} value={_value} selected={_value === value}>
          {label}
        </Select.Option>
      ))}
    </Select>
  )
}
