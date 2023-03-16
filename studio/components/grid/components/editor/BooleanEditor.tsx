import { Select } from 'ui'
import { EditorProps } from '@supabase/react-data-grid'
import { useTrackedState } from 'components/grid/store'

interface Props<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  isNullable?: boolean
}

export function BooleanEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  onRowChange,
  onClose,
}: Props<TRow, TSummaryRow>) {
  const state = useTrackedState()
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const value = row[column.key as keyof TRow] as unknown as string

  const onBlur = () => onClose(false)
  const onChange = (event: any) => {
    const value = event.target.value
    if (value === 'null') {
      onRowChange({ ...row, [column.key]: null }, true)
    } else {
      onRowChange({ ...row, [column.key]: value === 'true' }, true)
    }
  }

  return (
    <Select
      autoFocus
      id="boolean-editor"
      name="boolean-editor"
      size="small"
      onBlur={onBlur}
      onChange={onChange}
      defaultValue={value === null ? 'null' : value.toString()}
      style={{ width: `${gridColumn?.width || column.width}px` }}
    >
      <Select.Option value="true">TRUE</Select.Option>
      <Select.Option value="false">FALSE</Select.Option>
      {isNullable && <Select.Option value="null">NULL</Select.Option>}
    </Select>
  )
}
