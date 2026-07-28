// Remap `sql` → `unchecked_sql` on SQL snippet content objects as they cross the API boundary.
// The API stores and returns the field as `sql`; the frontend type uses `unchecked_sql` to make
// it explicit that this value must never be executed without user confirmation.
//
// Both database (`type: 'sql'`) and logs (`type: 'log_sql'`) snippets carry user-authored SQL
// under the same wire field, but each is branded with its own untrusted brand so Postgres SQL
// and logs SQL can never cross execution paths. Branding is per-type and never mixed.
import { untrustedSql } from '@supabase/pg-meta'

import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

function isSqlContentType(type: string): type is 'sql' | 'log_sql' {
  return type === 'sql' || type === 'log_sql'
}

export function remapSqlContentField<T extends { type: string }>(item: T): T {
  if (!isSqlContentType(item.type)) return item
  if (!('content' in item)) return item
  const content = item.content as Record<string, unknown>
  if (!('sql' in content)) return item
  const { sql, ...rest } = content
  const unchecked_sql =
    item.type === 'log_sql' ? untrustedLogSql(sql as string) : untrustedSql(sql as string)
  return { ...item, content: { ...rest, unchecked_sql } } as T
}

export function remapSqlContentFields<T extends { type: string }>(items: Array<T>): Array<T> {
  return items.map(remapSqlContentField)
}

// Reverse remap: `unchecked_sql` → `sql` before sending to the API.
export function unmapSqlContentField<T extends { type: string }>(item: T): T {
  if (!isSqlContentType(item.type)) return item
  if (!('content' in item)) return item
  const content = item.content as Record<string, unknown>
  if (!('unchecked_sql' in content)) {
    // Defensive guard against a writer that still submits the pre-rename `{ sql }` shape.
    // Such a payload happens to reach the wire correctly (the API stores `sql`), but it
    // means a save path was missed during the rename — surface it loudly in development.
    // Crucially, we NEVER fabricate `sql: undefined` here: that would clobber the user's
    // saved query text. The no-op below preserves whatever the content already holds.
    if (process.env.NODE_ENV !== 'production' && 'sql' in content) {
      throw new Error(
        `unmapSqlContentField: ${item.type} content is missing 'unchecked_sql' but still carries a raw 'sql' field — a save path was not migrated to the branded field.`
      )
    }
    return item
  }
  const { unchecked_sql, ...rest } = content
  return { ...item, content: { ...rest, sql: unchecked_sql } } as T
}
