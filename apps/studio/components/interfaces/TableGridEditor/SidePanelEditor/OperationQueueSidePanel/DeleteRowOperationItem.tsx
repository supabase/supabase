import { useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from 'ui'

import { formatOperationItemValue } from './OperationQueueSidePanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { tableRowKeys } from '@/data/table-rows/keys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { DeleteRowPayload } from '@/state/table-editor-operation-queue.types'

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
    <Card className="overflow-hidden border-destructive-500 bg-destructive-500/5">
      <CardHeader className="py-2 px-3 flex flex-row gap-2 border-b border-destructive-500 space-y-0 items-center">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <code className="text-code-inline dark:bg-surface-300 dark:border-foreground-muted/50">
              {fullTableName}
            </code>
            <div className="text-xs text-foreground mt-1 ml-0.5">
              <span>Delete row</span>
              <span className="text-foreground-muted mx-1.5">·</span>
              <span>where {whereClause}</span>
            </div>
          </div>
        </div>
        <ButtonTooltip
          type="text"
          aria-label="Discard change"
          className="w-7"
          icon={<Undo2 />}
          onClick={handleDelete}
          tooltip={{
            content: {
              side: 'left',
              align: 'end',
              text: 'Discard change',
            },
          }}
        />
      </CardHeader>

      <CardContent className="py-2 px-3 font-mono text-xs bg-destructive-100/30">
        <div className="text-destructive py-0.5">Row will be deleted</div>
      </CardContent>
    </Card>
  )
}
