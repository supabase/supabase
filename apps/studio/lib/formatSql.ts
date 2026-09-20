import { type SafeSqlFragment } from '@supabase/pg-meta'
import { format } from 'sql-formatter'

/**
 * Util function for formatting SQL. It wraps the `sql-formatter` library with a preset format options so that the
 * formatting is consistent across the app. It also has a try/catch block which returns the original SQL in case of
 * an error.
 */
export function formatSql(sql: SafeSqlFragment): SafeSqlFragment
export function formatSql(sql: string): string
export function formatSql(sql: string): string {
  try {
    return format(sql, {
      language: 'postgresql',
      keywordCase: 'lower',
    })
  } catch {
    return sql
  }
}
