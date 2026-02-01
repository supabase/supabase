import { useQueryClient } from '@tanstack/react-query'
import { Trash2, X } from 'lucide-react'
import { Button } from 'ui'

import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { DeleteRowPayload } from '@/state/table-editor-operation-queue.types'
import { formatOperationItemValue } from './OperationQueueSidePanel.utils'

interface DeleteRowOperationItemProps {
  operationId: string
  tableId: number
  content: DeleteRowPayload
}

export const DeleteRowOperationItem = ({
  operationId,
  tableId,
  content,
}: DeleteRowOperationItemProps) => {
  const { table, rowIdentifiers } = content
  const tableSchema = table.schema
  const tableName = table.name

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()

  const fullTableName = `${tableSchema}.${tableName}`
  const whereClause = Object.entries(rowIdentifiers)
    .map(([key, value]) => `${key} = ${formatOperationItemValue(value)}`)
    .join(', ')

  const handleDelete = () => {
    // Remove the operation from the queue
    snap.removeOperation(operationId)

    // Invalidate the query to revert the optimistic update
    if (project) {
      queryClient.invalidateQueries({
        queryKey: tableRowKeys.tableRowsAndCount(project.ref, tableId),
      })
    }
  }

  return (
    <div className="border rounded-md overflow-hidden bg-surface-100 border-l-4 border-l-destructive-500">
      <div className="px-3 py-2 border-b border-default bg-surface-200 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          <Trash2 size={14} className="text-destructive-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-foreground font-mono">{fullTableName}</div>
            <div className="text-sm text-foreground-muted mt-0.5">
              <span className="font-medium text-foreground">Delete row</span>
              <span className="text-foreground-muted mx-2">·</span>
              <span className="text-foreground text-xs">where {whereClause}</span>
            </div>
          </div>
        </div>
        <Button
          type="text"
          size="tiny"
          icon={<X size={14} />}
          onClick={handleDelete}
          className="shrink-0"
          aria-label="Remove operation"
        />
      </div>

      <div className="px-3 py-2 text-xs font-mono bg-destructive-100/30">
        <div className="text-destructive-500 line-through opacity-70">Row will be deleted</div>
      </div>
    </div>
  )
}
