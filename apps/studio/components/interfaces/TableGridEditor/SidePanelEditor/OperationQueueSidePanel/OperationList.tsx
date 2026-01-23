import {
  QueuedOperation,
  QueuedOperationType,
  type OperationStatus,
} from 'state/table-editor-operation-queue.types'

import { OperationItem } from './OperationItem'

interface OperationListProps {
  operations: readonly QueuedOperation[]
  getOperationStatus?: (operationId: string) => OperationStatus
  getOperationError?: (operationId: string) => string | undefined
}

export const OperationList = ({
  operations,
  getOperationStatus = () => 'pending',
  getOperationError,
}: OperationListProps) => {
  if (operations.length === 0) {
    return <p className="text-sm text-foreground-light">No pending changes</p>
  }

  return (
    <div className="space-y-2">
      {operations.map((op) => {
        if (op.type === QueuedOperationType.EDIT_CELL_CONTENT) {
          const payload = op.payload
          return <OperationItem key={op.id} operationItem={op} />
        }
        return null
      })}
    </div>
  )
}
