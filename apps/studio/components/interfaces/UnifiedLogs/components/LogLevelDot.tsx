import { ColumnSchema } from '../UnifiedLogs.schema'
import { DataTableColumnLevelIndicator } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnLevelIndicator'

/** Colored dot for a log's level, muted when the log has none. */
export const LogLevelDot = ({ level }: { level: ColumnSchema['level'] | undefined }) =>
  level ? (
    <DataTableColumnLevelIndicator value={level} dotClassName="h-1.5 w-1.5" />
  ) : (
    <span className="block h-1.5 w-1.5 rounded-full bg-foreground-muted" />
  )
