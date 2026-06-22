import type { RenderEditCellProps } from 'react-data-grid'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui'

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
    <Select
      name="boolean-editor"
      defaultValue={value === null || value === undefined ? 'null' : value.toString()}
      onValueChange={onChange}
    >
      <SelectTrigger onBlur={onBlur} style={{ width: `${column.width}px` }}>
        <SelectValue id="boolean-editor" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="true">TRUE</SelectItem>
          <SelectItem value="false">FALSE</SelectItem>
          {isNullable ? <SelectItem value="null">NULL</SelectItem> : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
