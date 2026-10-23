import type { ServiceError } from '@/components/grid/types'
import { Entity, isTableLike } from '@/data/table-editor/table-editor-types'

export function getPrimaryKeys({ table }: { table: Entity }): {
  primaryKeys?: string[]
  error?: ServiceError
} {
  if (!isTableLike(table)) {
    return {
      error: { message: 'Only table rows can be updated or deleted' },
    }
  }

  const pkColumns = table.primary_keys
  if (!pkColumns || pkColumns.length == 0) {
    return {
      error: { message: 'Please add a primary key column to your table to update or delete rows' },
    }
  }
  return { primaryKeys: pkColumns.map((x) => x.name) }
}
