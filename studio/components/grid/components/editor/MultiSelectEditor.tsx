import { useState } from 'react'
import { Popover, IconX, IconPlus } from '@supabase/ui'
import { EditorProps } from '@supabase/react-data-grid'

import { useTrackedState } from 'components/grid/store'
import { convertPgArrayToJsArray, convertJsArraytoPgArray } from 'lib/helpers'

interface Props<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  options?: { label: string; value: string }[]
}

// Mainly for arrays (specifically enums)
// Array elements are not unique, so this supports selecting an option more than once
export function MultiSelectEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
  options = [],
}: Props<TRow, TSummaryRow>) {
  const state = useTrackedState()
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)

  const originalValue = row[column.key as keyof TRow] as string
  const [selectedValues, setSelectedValues] = useState(convertPgArrayToJsArray(originalValue))

  const onOpenChange = (open: boolean) => {
    if (!open) {
      const updatedValue = convertJsArraytoPgArray(selectedValues)
      if (updatedValue === originalValue) {
        onClose()
      } else {
        onRowChange({ ...row, [column.key]: updatedValue }, true)
      }
    }
  }

  const handleAdd = (option: { label: string; value: string }) => {
    const updatedValues = selectedValues.concat([option.value])
    setSelectedValues(updatedValues)
  }

  const handleRemove = (idx: number) => {
    const updatedValues = selectedValues.filter((x, index) => index !== idx)
    setSelectedValues(updatedValues)
  }

  return (
    <Popover
      open
      side="bottom"
      align="start"
      sideOffset={-35}
      className="rounded-none"
      onOpenChange={onOpenChange}
      overlay={
        <div style={{ width: `calc(${gridColumn?.width || column.width}px - 2px)` }}>
          <div className="flex gap-2 p-1 flex-wrap">
            {selectedValues.map((value, idx) => (
              <div
                className={[
                  'text-typography-body-light dark:text-typography-body-dark',
                  'flex items-center space-x-2 rounded bg-gray-500',
                  'py-0.5 px-2 text-xs',
                ].join(' ')}
              >
                <span>{value}</span>
                <IconX
                  size={12}
                  className="cursor-pointer opacity-50 transition hover:opacity-100"
                  onClick={(e: any) => {
                    e.preventDefault()
                    handleRemove(idx)
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className="bg-scale-200 p-1 border-t border-scale-500 space-y-1 overflow-y-auto"
            style={{ maxHeight: '160px' }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={[
                  'py-1 px-2 rounded group flex items-center justify-between',
                  'hover:bg-scale-400 cursor-pointer transition',
                ].join(' ')}
                onClick={() => handleAdd(option)}
              >
                <p className="text-xs">{option.label}</p>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                  <IconPlus size={12} />
                  <p className="text-xs text-scale-1000">Add value</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  )
}
