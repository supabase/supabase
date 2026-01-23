import type { OperationStatus, QueuedOperation } from 'state/table-editor-operation-queue.types'
import { cn } from 'ui'

import { formatValue } from './OperationQueueSidePanel.utils'

interface OperationItemProps {
  operationItem: QueuedOperation
}

export const OperationItem = ({ operationItem }: OperationItemProps) => {
  const { columnName, rowIdentifiers, oldValue, newValue } = operationItem.payload
  return (
    <div
      className={cn(
        'border rounded-md p-3 bg-surface-100',
        status === 'success' && 'border-brand/50 bg-brand/5',
        status === 'error' && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">{columnName}</span>
          </div>

          <div className="text-xs font-mono text-foreground-light mb-2">
            <span className="text-foreground-muted">Row: </span>
            {Object.entries(rowIdentifiers)
              .map(([key, value]) => `${key}=${formatValue(value)}`)
              .join(', ')}
          </div>

          <div className="flex items-start gap-2 text-xs font-mono">
            <div className="flex-1 min-w-0">
              <div className="text-foreground-muted mb-1">Old value:</div>
              <div className="bg-surface-200 rounded px-2 py-1 break-all text-foreground-light">
                {formatValue(oldValue)}
              </div>
            </div>
            <div className="text-foreground-muted self-center mt-4">-&gt;</div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground-muted mb-1">New value:</div>
              <div className="bg-surface-200 rounded px-2 py-1 break-all text-foreground">
                {formatValue(newValue)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
