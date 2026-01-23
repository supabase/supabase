import { formatValue } from './OperationQueueSidePanel.utils'
import { EditCellContentPayload } from '@/state/table-editor-operation-queue.types'

interface OperationItemProps {
  content: EditCellContentPayload
}

export const OperationItem = ({ content }: OperationItemProps) => {
  const { table, columnName, oldValue, newValue, rowIdentifiers } = content
  const tableSchema = table.schema
  const tableName = table.name

  const fullTableName = `${tableSchema}.${tableName}`
  const whereClause = Object.entries(rowIdentifiers)
    .map(([key, value]) => `${key} = ${formatValue(value)}`)
    .join(', ')

  const formattedOldValue = formatValue(oldValue)
  const formattedNewValue = formatValue(newValue)

  return (
    <div className="border rounded-md overflow-hidden bg-surface-100">
      <div className="px-3 py-2 border-b border-default bg-surface-200">
        <div className="text-xs text-foreground font-mono">{fullTableName}</div>
        <div className="text-sm text-foreground-muted mt-0.5">
          <span className="font-medium text-foreground">{columnName}</span>
          <span className="text-foreground-muted mx-2">·</span>
          <span className="text-foreground text-xs">where {whereClause}</span>
        </div>
      </div>

      <div className="font-mono text-xs">
        <div className="flex items-start gap-2 px-3 py-0.5 bg-red-400/20">
          <span className="text-red-900 select-none font-bold">-</span>
          <span className="text-red-900 truncate max-w-full" title={formattedOldValue}>
            {formattedOldValue}
          </span>
        </div>

        <div className="flex items-start gap-2 px-3 py-0.5 bg-green-400/20">
          <span className="text-green-900 select-none font-bold">+</span>
          <span className="text-green-900 truncate max-w-full" title={formattedNewValue}>
            {formattedNewValue}
          </span>
        </div>
      </div>
    </div>
  )
}
