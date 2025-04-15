import { TableCell, TableRow } from 'ui'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { columns } from '../columns'

export function LiveRow() {
  return (
    <TableRow>
      <TableCell className="w-[--header-level-size] min-w-[--header-level-size] max-w-[--header-level-size] border-b border-l border-r border-t border-info border-r-info/50">
        <DataTableColumnLevelIndicator value="info" />
      </TableCell>
      <TableCell
        colSpan={columns.length - 1}
        className="border-b border-r border-t border-info font-medium text-info"
      >
        Live Mode
      </TableCell>
    </TableRow>
  )
}
