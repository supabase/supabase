import { QueuedOperation, QueuedOperationType } from 'state/table-editor-operation-queue.types'

import { OperationItem } from './OperationItem'

interface OperationListProps {
  operations: readonly QueuedOperation[]
}

export const OperationList = ({ operations }: OperationListProps) => {
  if (operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-md text-foreground-muted">No pending changes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {operations.map((op) => {
        if (op.type === QueuedOperationType.EDIT_CELL_CONTENT) {
          return (
            <OperationItem
              key={op.id}
              operationId={op.id}
              tableId={op.tableId}
              content={op.payload}
            />
          )
        }
        return null
      })}
    </div>
  )
}
