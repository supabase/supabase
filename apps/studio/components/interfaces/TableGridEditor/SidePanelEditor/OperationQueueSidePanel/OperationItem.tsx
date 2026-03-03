import { useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from 'state/table-editor'

import { formatOperationItemValue } from './OperationQueueSidePanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { EditCellContentPayload } from '@/state/table-editor-operation-queue.types'
import { Card, CardContent, CardHeader } from 'ui'

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
    <Card className="overflow-hidden">
      <CardHeader className="pt-2.5 flex flex-row gap-2">
        <div className="min-w-0 flex-1">
          <code className="text-code-inline dark:bg-surface-300 dark:border-foreground-muted/50">
            {fullTableName}
          </code>
          <div className="text-xs text-foreground mt-1 ml-0.5">
            <span>{columnName}</span>
            <span className="text-foreground-muted mx-1.5">·</span>
            <span>where {whereClause}</span>
          </div>
        </div>
        <ButtonTooltip
          type="text"
          size="tiny"
          aria-label="Revert change"
          className="px-1.5"
          icon={<Undo2 />}
          onClick={handleDelete}
          tooltip={{
            content: {
              side: 'bottom',
              align: 'end',
              text: 'Revert change',
            },
          }}
        />
      </CardHeader>

      <CardContent className="font-mono text-xs">
        <div className="flex gap-2 py-0.5">
          <span className="text-destructive select-none font-medium">-</span>
          <span className="text-destructive truncate max-w-full" title={formattedOldValue}>
            {formattedOldValue}
          </span>
        </div>

        <div className="flex gap-2 py-0.5">
          <span className="text-brand-link select-none font-medium">+</span>
          <span className="text-brand-link truncate max-w-full" title={formattedNewValue}>
            {formattedNewValue}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
