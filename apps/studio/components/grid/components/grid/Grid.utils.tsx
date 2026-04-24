import { useCallback } from 'react'
import { RowsChangeData } from 'react-data-grid'
import { toast } from 'sonner'

import { useTableRowOperations } from '../../hooks/useTableRowOperations'
import { SupaRow } from '@/components/grid/types'
import { convertByteaToHex } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { DocsButton } from '@/components/ui/DocsButton'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { DOCS_URL } from '@/lib/constants'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'
import type { Dictionary } from '@/types'

export function useOnRowsChange(rows: SupaRow[]) {
  const snap = useTableEditorTableStateSnapshot()
  const { editCell } = useTableRowOperations()

  return useCallback(
    (_rows: SupaRow[], data: RowsChangeData<SupaRow, unknown>) => {
      const rowData = _rows[data.indexes[0]]
      const previousRow = rows.find((x) => x.idx == rowData.idx)
      const changedColumn = Object.keys(rowData).find(
        (name) => rowData[name] !== previousRow![name]
      )

      if (!previousRow || !changedColumn) return

      const enumArrayColumns = snap.originalTable.columns
        ?.filter((column) => {
          return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
        })
        .map((column) => column.name)

      const identifiers = {} as Dictionary<any>

      isTableLike(snap.originalTable) &&
        snap.originalTable.primary_keys.forEach((column) => {
          const col = snap.originalTable.columns.find((c) => c.name === column.name)
          identifiers[column.name] =
            col?.format === 'bytea'
              ? convertByteaToHex(previousRow[column.name])
              : previousRow[column.name]
        })

      if (Object.keys(identifiers).length === 0) {
        return toast('Unable to update row as table has no primary keys', {
          description: (
            <div>
              <p className="text-sm text-foreground-light">
                Add a primary key column to your table first to serve as a unique identifier for
                each row before updating or deleting the row.
              </p>
              <div className="mt-3">
                <DocsButton href={`${DOCS_URL}/guides/database/tables#primary-keys`} />
              </div>
            </div>
          ),
        })
      }

      editCell({
        tableId: snap.table.id,
        table: snap.originalTable,
        row: previousRow,
        rowIdentifiers: identifiers,
        columnName: changedColumn,
        oldValue: previousRow[changedColumn],
        newValue: rowData[changedColumn],
        enumArrayColumns,
      })
    },
    [editCell, rows, snap.originalTable, snap.table.id]
  )
}
