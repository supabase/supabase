import { useQueryClient } from '@tanstack/react-query'
import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { X } from 'lucide-react'
import { useTableEditorStateSnapshot } from 'state/table-editor'

import { formatOperationItemValue } from './OperationQueueSidePanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { EditCellContentPayload } from '@/state/table-editor-operation-queue.types'

interface OperationItemProps {
  operationId: string
  tableId: number
  content: EditCellContentPayload
}

export const OperationItem = ({ operationId, tableId, content }: OperationItemProps) => {
  const { table, columnName, oldValue, newValue, rowIdentifiers } = content
  const tableSchema = table.schema
  const tableName = table.name

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()

  const fullTableName = `${tableSchema}.${tableName}`
  const whereClause = Object.entries(rowIdentifiers)
    .map(([key, value]) => `${key} = ${formatOperationItemValue(value)}`)
    .join(', ')

  const formattedOldValue = formatOperationItemValue(oldValue)
  const formattedNewValue = formatOperationItemValue(newValue)

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
    <div className="border rounded-md overflow-hidden bg-surface-100">
      <div className="px-3 py-2 border-b border-default bg-surface-200 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-foreground font-mono">{fullTableName}</div>
          <div className="text-sm text-foreground-muted mt-0.5">
            <span className="font-medium text-foreground">{columnName}</span>
            <span className="text-foreground-muted mx-2">•</span>
            <span className="text-foreground text-xs">where {whereClause}</span>
          </div>
        </div>
        <ButtonTooltip
          type="text"
          size="tiny"
          icon={<X size={14} />}
          onClick={handleDelete}
          className="shrink-0 w-7"
          aria-label="Remove operation"
          tooltip={{ content: { side: 'bottom', text: 'Remove operation' } }}
        />
      </div>

      <div className="font-mono text-xs">
        <div className="flex items-start gap-2 px-3 py-0.5 bg-red-400/20">
          <span className="text-red-900 select-none font-bold">-</span>
          <span className="text-red-900 truncate max-w-full" title={formattedOldValue}>
            {formattedOldValue}
          </span>
        </div>

        <div className="flex items-start gap-2 px-3 py-0.5 bg-green-400/20">
          <span className="text-green-900 select-none font-bold">+</span>
          <span className="text-green-900 truncate max-w-full" title={formattedNewValue}>
            {formattedNewValue}
          </span>
        </div>
      </div>
    </div>
  )
}
