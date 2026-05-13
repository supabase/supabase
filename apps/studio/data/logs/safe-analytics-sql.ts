// pg-meta's `literal()` and `ident()` are Postgres-specific: `literal()` emits
// `E'…'` for backslash-bearing strings and `::jsonb` casts for objects;
// `ident()` quotes identifiers with double-quotes, which BigQuery rejects
// (double-quoted tokens are string literals there, not identifiers). We add
// analytics-engine-specific helpers here rather than extend pg-meta, which
// would cross-cut unrelated Postgres callers.
//
// String literals: ClickHouse and BigQuery share the same convention —
// double the single quote (`''`) and double the backslash (`\\`), inside
// plain `'…'` delimiters.
//
// Identifiers: BigQuery requires backticks. ClickHouse accepts both
// backticks and double-quotes; we use double-quotes (SQL-standard form).
// In both engines a backslash inside a quoted identifier is an escape
// character, so we reject any non-`[A-Za-z_][A-Za-z0-9_]*` input rather than
// try to escape it — column names never need special characters in practice.
import { rawSql, type SafeSqlFragment } from '@supabase/pg-meta'

export { joinSqlFragments, keyword, rawSql, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

export function analyticsLiteral(value: string | number | boolean): SafeSqlFragment {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('analyticsLiteral: non-finite numbers are not supported')
    }
    return rawSql(String(value))
  }
  if (typeof value === 'boolean') {
    return rawSql(value ? 'true' : 'false')
  }
  if (typeof value !== 'string') {
    throw new Error('analyticsLiteral: only string, number, or boolean inputs are supported')
  }
  let escaped = ''
  for (const c of value) {
    if (c === "'") escaped += "''"
    else if (c === '\\') escaped += '\\\\'
    else escaped += c
  }
  return rawSql(`'${escaped}'`)
}

const SAFE_IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Quote an identifier for BigQuery using backticks. */
export function bqIdent(value: string): SafeSqlFragment {
  if (typeof value !== 'string' || !SAFE_IDENT_RE.test(value)) {
    throw new Error(`bqIdent: invalid BigQuery identifier "${value}"`)
  }
  return rawSql('`' + value + '`')
}

/** Quote an identifier for ClickHouse using double-quotes. */
export function clickhouseIdent(value: string): SafeSqlFragment {
  if (typeof value !== 'string' || !SAFE_IDENT_RE.test(value)) {
    throw new Error(`clickhouseIdent: invalid ClickHouse identifier "${value}"`)
  }
  return rawSql('"' + value + '"')
}
