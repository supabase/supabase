import { useQueryClient } from '@tanstack/react-query'
import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Plus, X } from 'lucide-react'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button } from 'ui'

import { formatOperationItemValue } from './OperationQueueSidePanel.utils'
import { AddRowPayload } from '@/state/table-editor-operation-queue.types'

interface AddRowOperationItemProps {
  operationId: string
  tableId: number
  content: AddRowPayload
}

export const AddRowOperationItem = ({
  operationId,
  tableId,
  content,
}: AddRowOperationItemProps) => {
  const { table, rowData } = content
  const tableSchema = table.schema
  const tableName = table.name

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()

  const fullTableName = `${tableSchema}.${tableName}`

  // Get first 3 column values for preview
  const columns = Object.entries(rowData).filter(([key]) => !key.startsWith('__') && key !== 'idx')
  const previewColumns = columns.slice(0, 3)
  const remainingCount = columns.length - previewColumns.length

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
    <div className="border rounded-md overflow-hidden bg-surface-100 border-l-4 border-l-brand-500">
      <div className="px-3 py-2 border-b border-default bg-surface-200 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          <Plus size={14} className="text-brand-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-foreground font-mono">{fullTableName}</div>
            <div className="text-sm text-foreground-muted mt-0.5">
              <span className="font-medium text-foreground">New row</span>
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

      <div className="px-3 py-2 text-xs font-mono space-y-1 bg-brand-100/30">
        {previewColumns.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-foreground">
            <span className="text-foreground-light">{key}:</span>
            <span className="truncate" title={formatOperationItemValue(value)}>
              {formatOperationItemValue(value)}
            </span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-foreground-light">+{remainingCount} more column(s)</div>
        )}
      </div>
    </div>
  )
}
