import { useQueryClient } from '@tanstack/react-query'
import { Plus, Undo2 } from 'lucide-react'
import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from 'state/table-editor'

import { formatOperationItemValue } from './OperationQueueSidePanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { AddRowPayload } from '@/state/table-editor-operation-queue.types'
import { Card, CardContent, CardHeader } from 'ui'

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
    <Card className="overflow-hidden">
      <CardHeader className="pt-2.5 flex flex-row gap-2">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <code className="text-code-inline dark:bg-surface-300 dark:border-foreground-muted/50">
              {fullTableName}
            </code>
            <div className="text-xs text-foreground mt-1 ml-0.5">
              <span>New row</span>
            </div>
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

      <CardContent className="font-mono text-xs space-y-1 text-brand-link">
        {previewColumns.map(([key, value]) => (
          <div key={key} className="flex gap-2 py-0.5">
            <span className="text-brand-link select-none font-medium">+</span>
            <span className="shrink-0">{key}:</span>
            <span className="truncate min-w-0" title={formatOperationItemValue(value)}>
              {formatOperationItemValue(value)}
            </span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex gap-2 py-0.5">
            <span className="text-brand-link select-none font-medium">+</span>
            <span>+{remainingCount} more column(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
