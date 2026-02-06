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
    return <p className="text-sm text-foreground-light">No pending changes</p>
  }

  const addOperations = operations.filter(isAddRowOperation)
  const deleteOperations = operations.filter(isDeleteRowOperation)
  const editOperations = operations.filter(isEditCellContentOperation)

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
                content={op.payload}
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
                content={op.payload}
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
                content={op.payload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
