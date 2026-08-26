import { NullValue } from '../common/NullValue'
import { SupaRow } from '@/components/grid/types'
import { convertByteaToHex } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'

interface SelectGridCellFormatterProps {
  row: SupaRow
  column: string
  format: string
}

export const SelectGridCellFormatter = ({ row, column, format }: SelectGridCellFormatterProps) => {
  const formattedValue =
    format === 'bytea'
      ? convertByteaToHex(row[column])
      : row[column] === null
        ? null
        : typeof row[column] === 'object'
          ? JSON.stringify(row[column])
          : row[column]

  return (
    <div className="group sb-grid-select-cell__formatter overflow-hidden">
      {formattedValue === null ? (
        <NullValue />
      ) : (
        <span className="text-sm truncate">{formattedValue}</span>
      )}
    </div>
  )
}
