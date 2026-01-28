import {
  AddRowPayload,
  DeleteRowPayload,
  EditCellContentPayload,
  QueuedOperation,
  QueuedOperationType,
} from 'state/table-editor-operation-queue.types'

import { AddRowOperationItem } from './AddRowOperationItem'
import { DeleteRowOperationItem } from './DeleteRowOperationItem'
import { OperationItem } from './OperationItem'

interface OperationListProps {
  operations: readonly QueuedOperation[]
}

export const OperationList = ({ operations }: OperationListProps) => {
  if (operations.length === 0) {
    return <p className="text-sm text-foreground-light">No pending changes</p>
  }

  // Group operations by type
  const deleteOperations = operations.filter(
    (op) => op.type === QueuedOperationType.DELETE_ROW
  )
  const addOperations = operations.filter((op) => op.type === QueuedOperationType.ADD_ROW)
  const editOperations = operations.filter(
    (op) => op.type === QueuedOperationType.EDIT_CELL_CONTENT
  )

  return (
    <div className="space-y-6">
      {deleteOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground-light">
            Rows to Delete ({deleteOperations.length})
          </h3>
          <div className="space-y-3">
            {deleteOperations.map((op) => (
              <DeleteRowOperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload as DeleteRowPayload}
              />
            ))}
          </div>
        </div>
      )}

      {addOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground-light">
            Rows to Add ({addOperations.length})
          </h3>
          <div className="space-y-3">
            {addOperations.map((op) => (
              <AddRowOperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload as AddRowPayload}
              />
            ))}
          </div>
        </div>
      )}

      {editOperations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground-light">
            Cell Edits ({editOperations.length})
          </h3>
          <div className="space-y-3">
            {editOperations.map((op) => (
              <OperationItem
                key={op.id}
                operationId={op.id}
                tableId={op.tableId}
                content={op.payload as EditCellContentPayload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
