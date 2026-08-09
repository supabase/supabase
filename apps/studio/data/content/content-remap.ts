// Remap `sql` → `unchecked_sql` on SQL snippet content objects as they cross the API boundary.
// The API stores and returns the field as `sql`; the frontend type uses `unchecked_sql` to make
// it explicit that this value must never be executed without user confirmation.
import { untrustedSql } from '@supabase/pg-meta'

export function remapSqlContentField<T extends { type: string }>(item: T): T {
  if (item.type !== 'sql') return item
  if (!('content' in item)) return item
  const content = item.content as Record<string, unknown>
  if (!('sql' in content)) return item
  const { sql, ...rest } = content
  return { ...item, content: { ...rest, unchecked_sql: untrustedSql(sql as string) } } as T
}

export function remapSqlContentFields<T extends { type: string }>(items: Array<T>): Array<T> {
  return items.map(remapSqlContentField)
}

// Reverse remap: `unchecked_sql` → `sql` before sending to the API.
export function unmapSqlContentField<T extends { type: string }>(item: T): T {
  if (item.type !== 'sql') return item
  if (!('content' in item)) return item
  const content = item.content as Record<string, unknown>
  if (!('unchecked_sql' in content)) return item
  const { unchecked_sql, ...rest } = content
  return { ...item, content: { ...rest, sql: unchecked_sql } } as T
}
