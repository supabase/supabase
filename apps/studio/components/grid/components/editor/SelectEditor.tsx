import type { RenderEditCellProps } from 'react-data-grid'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui'

interface SelectEditorProps<TRow, TSummaryRow = unknown> extends RenderEditCellProps<
  TRow,
  TSummaryRow
> {
  isNullable?: boolean
  options: { label: string; value: string }[]
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

  function onChange(value: string) {
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
    <Select name="select-editor" defaultValue={value ?? ''} onValueChange={onChange}>
      <SelectTrigger onBlur={onBlur} style={{ width: `${column.width}px` }}>
        <SelectValue id="select-editor" placeholder="NULL" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {isNullable ? <SelectItem value={null as any}>NULL</SelectItem> : null}
          {options.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
