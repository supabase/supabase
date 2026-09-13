// Remap `sql` → `unchecked_sql` on SQL snippet content objects as they cross the API boundary.
// The API stores and returns the field as `sql`; the frontend type uses `unchecked_sql` to make
// it explicit that this value must never be executed without user confirmation.
//
// Both database (`type: 'sql'`) and logs (`type: 'log_sql'`) snippets carry user-authored SQL
// under the same wire field, but each is branded with its own untrusted brand so Postgres SQL
// and logs SQL can never cross execution paths. Branding is per-type and never mixed.
//
// Notebooks (`type: 'notebook'`) carry the same kind of untrusted SQL, but nested per-cell
// rather than as a single top-level field, so they go through the dedicated notebook schemas
// (data/content/notebooks/notebook-schema.ts) instead of the single-field swap below.
import { untrustedSql } from '@supabase/pg-meta'

import type { WritableNotebook } from './notebooks/notebook-schema'
import { notebookDomainSchema, toWireWritableNotebook } from './notebooks/notebook-schema'
import type { SnippetStatus } from './snippet-status'
import type { SnippetWithContent } from './sql-folders-query'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

function isSqlContentType(type: string): type is 'sql' | 'log_sql' {
  return type === 'sql' || type === 'log_sql'
}

function isNotebookContentType(type: string): type is 'notebook' {
  return type === 'notebook'
}

export function remapSqlContentField<T extends { type: string }>(item: T): T {
  if (isNotebookContentType(item.type)) {
    if (!('content' in item)) return item
    const content = notebookDomainSchema.parse(item.content)
    return { ...item, content } as T
  }
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

// Wire→domain boundary for a single SQL-editor snippet. The platform API types a
// content row's `content` as an opaque `{ [key: string]: unknown }` map (and its
// `type` as the full `'sql' | 'report' | 'log_sql'`), so turning a fetched row
// into a branded, discriminated `SnippetWithContent` needs exactly one assertion.
// Concentrating it here — the single place that already owns the sql↔unchecked_sql
// rename — keeps the query/mutation call sites free of `as unknown as` casts.
export function remapWireSnippet(row: unknown, status: SnippetStatus): SnippetWithContent {
  const snippet = remapSqlContentField(row as SnippetWithContent)
  return { ...snippet, status }
}

// Reverse remap: `unchecked_sql` → `sql` before sending to the API.
export function unmapSqlContentField<T extends { type: string }>(item: T): T {
  if (isNotebookContentType(item.type)) {
    if (!('content' in item)) return item
    const content = toWireWritableNotebook(item.content as WritableNotebook)
    return { ...item, content } as T
  }
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
