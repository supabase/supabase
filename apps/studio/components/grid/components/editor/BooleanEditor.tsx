import type { RenderEditCellProps } from 'react-data-grid'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

interface Props<TRow, TSummaryRow = unknown> extends RenderEditCellProps<TRow, TSummaryRow> {
  isNullable?: boolean
}

export const BooleanEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  onRowChange,
  onClose,
}: Props<TRow, TSummaryRow>) => {
  const value = row[column.key as keyof TRow] as unknown as string

  const onBlur = () => onClose(false)
  const onChange = (value: string) => {
    if (value === 'null') {
      onRowChange({ ...row, [column.key]: null }, true)
    } else {
      onRowChange({ ...row, [column.key]: value === 'true' }, true)
    }
  }

  return (
    <Select_Shadcn_
      name="boolean-editor"
      defaultValue={value === null || value === undefined ? 'null' : value.toString()}
      onValueChange={onChange}
    >
      <SelectTrigger_Shadcn_ onBlur={onBlur} style={{ width: `${column.width}px` }}>
        <SelectValue_Shadcn_ id="boolean-editor" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectItem_Shadcn_ value="true">TRUE</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="false">FALSE</SelectItem_Shadcn_>
          {isNullable ? <SelectItem_Shadcn_ value="null">NULL</SelectItem_Shadcn_> : null}
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
