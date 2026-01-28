import { QueuedOperation, QueuedOperationType } from 'state/table-editor-operation-queue.types'

import { OperationItem } from './OperationItem'

interface OperationListProps {
  operations: readonly QueuedOperation[]
}

export const OperationList = ({ operations }: OperationListProps) => {
  if (operations.length === 0) {
    return <p className="text-sm text-foreground-light">No pending changes</p>
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
