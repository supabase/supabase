import { Listbox } from '@supabase/ui'
import { EditorProps } from '@supabase/react-data-grid'

import { useTrackedState } from 'components/grid/store'
import MultiSelect from 'components/ui/MultiSelect'

interface MultiSelectEditorProps<TRow, TSummaryRow = unknown>
  extends EditorProps<TRow, TSummaryRow> {
  options?: { label: string; value: string }[]
}

// Mainly for arrays (specifically enums)
// Array elements are not unique, so this supports selecting an option more than once
export function MultiSelectEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: MultiSelectEditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState()
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)

  // Hardcoded options for now
  const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Orange', value: 'orange' },
  ]

  const value = row[column.key as keyof TRow] as unknown as string
  console.log('value', value)

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

  // return (
  //   <MultiSelect
  //     options={options}
  //     value={selectedRoles}
  //     placeholder="Defaults to all roles if none selected"
  //     searchPlaceholder="Search for a role"
  //     onChange={onUpdateSelectedRoles}
  //   />
  // )

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
