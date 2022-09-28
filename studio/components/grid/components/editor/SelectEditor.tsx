import { Listbox } from '@supabase/ui'
import { EditorProps } from '@supabase/react-data-grid'

import { useTrackedState } from 'components/grid/store'

interface SelectEditorProps<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  options: { label: string; value: string }[]
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
    <Listbox
      autoFocus
      id="select-editor"
      name="select-editor"
      size="small"
      defaultValue={value ?? ''}
      className="sb-grid-select-editor !gap-2"
      style={{ width: `${gridColumn?.width || column.width}px` }}
      onChange={onChange}
      onBlur={onBlur}
    >
      <Listbox.Option id="NULL" label="NULL" value="">
        NULL
      </Listbox.Option>
      {options.map(({ label, value }) => (
        <Listbox.Option key={value} label={label} value={value}>
          {label}
        </Listbox.Option>
      ))}
    </Listbox>
  )
}
