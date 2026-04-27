import type { RenderEditCellProps } from 'react-data-grid'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

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
    <Select_Shadcn_ name="select-editor" defaultValue={value ?? ''} onValueChange={onChange}>
      <SelectTrigger_Shadcn_ onBlur={onBlur} style={{ width: `${column.width}px` }}>
        <SelectValue_Shadcn_ id="select-editor" placeholder="NULL" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          {isNullable ? <SelectItem_Shadcn_ value={null as any}>NULL</SelectItem_Shadcn_> : null}
          {options.map(({ label, value }) => (
            <SelectItem_Shadcn_ key={value} value={value}>
              {label}
            </SelectItem_Shadcn_>
          ))}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
