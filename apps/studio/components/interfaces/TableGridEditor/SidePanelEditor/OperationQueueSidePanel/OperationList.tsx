import {
  QueuedOperation,
  isAddRowOperation,
  isDeleteRowOperation,
  isEditCellContentOperation,
} from 'state/table-editor-operation-queue.types'

import { AddRowOperationItem } from './AddRowOperationItem'
import { DeleteRowOperationItem } from './DeleteRowOperationItem'
import { OperationItem } from './OperationItem'

interface OperationListProps {
  operations: readonly QueuedOperation[]
}

export const OperationList = ({ operations }: OperationListProps) => {
  if (operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-base text-foreground-muted">No pending changes</p>
      </div>
    )
  }

  const addOperations = operations.filter(isAddRowOperation)
  const deleteOperations = operations.filter(isDeleteRowOperation)
  const editOperations = operations.filter(isEditCellContentOperation)

  return (
    <div className="space-y-8">
      {deleteOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs text-foreground-lighter">
            {deleteOperations.length} row deletion{deleteOperations.length !== 1 ? 's' : ''}
          </h3>

          <div className="space-y-3">
            {deleteOperations.map((op) => (
              <DeleteRowOperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload}
              />
            ))}
          </div>
        </div>
      )}

      {addOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs text-foreground-lighter">
            {addOperations.length} row addition{addOperations.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {addOperations.map((op) => (
              <AddRowOperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload}
              />
            ))}
          </div>
        </div>
      )}

      {editOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs text-foreground-lighter">
            {editOperations.length} cell edit{editOperations.length !== 1 ? 's' : ''}
          </h3>

          <div className="space-y-3">
            {editOperations.map((op) => (
              <OperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
