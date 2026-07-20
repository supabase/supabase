import { ColumnList } from './ColumnList'
import type { SafePostgresColumn } from '@/lib/postgres-types'

interface TableDetailColumnsTabProps {
  onAddColumn: () => void
  onEditColumn: (column: SafePostgresColumn) => void
  onDeleteColumn: (column: SafePostgresColumn) => void
}

export function TableDetailColumnsTab({
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: TableDetailColumnsTabProps) {
  return (
    <ColumnList
      onAddColumn={onAddColumn}
      onEditColumn={onEditColumn}
      onDeleteColumn={onDeleteColumn}
    />
  )
}
