// pg-meta's `literal()` and `ident()` are Postgres-specific: `literal()` emits
// `E'…'` for backslash-bearing strings and `::jsonb` casts for objects;
// `ident()` quotes identifiers with double-quotes, which BigQuery rejects
// (double-quoted tokens are string literals there, not identifiers). We add
// analytics-engine-specific helpers here rather than extend pg-meta, which
// would cross-cut unrelated Postgres callers.
//
// The brand `SafeLogSqlFragment` is intentionally distinct from pg-meta's
// `SafeSqlFragment`: escaping that is safe for Postgres (`E'…'` strings,
// `::jsonb` casts, double-quoted identifiers) is not safe for BigQuery or
// ClickHouse, and vice versa. Keeping the brands disjoint prevents a
// Postgres-escaped fragment from being composed into an analytics query
// (or vice versa) and silently emitting unsafe SQL.
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

/**
 * A branded string type representing a SQL fragment that is safe to compose
 * into BigQuery or ClickHouse queries. Intentionally distinct from pg-meta's
 * `SafeSqlFragment` (Postgres-only).
 *
 * Values of this type are either:
 * - Static strings in source code (no interpolation) via `rawSql`
 * - Outputs of `analyticsLiteral`, `bqIdent`, or `clickhouseIdent`
 * - Compositions via the `safeSql` template tag (which only accepts
 *   `SafeLogSqlFragment` interpolations)
 * - Compositions via `joinSqlFragments`
 *
 * Never cast arbitrary strings to this type.
 */
export type SafeLogSqlFragment = string & { readonly __safeLogSqlFragmentBrand: never }

export type LogSqlFragmentSeparator =
  | ','
  | ', '
  | ';\n'
  | ' and '
  | ' AND '
  | ' or '
  | ' OR '
  | ' union all '
  | ' union '
  | ' UNION ALL '
  | ' UNION '
  | '\n'
  | '\n\n'
  | ' '

/**
 * Tagged template literal for composing log-SQL fragments safely.
 * Only accepts `SafeLogSqlFragment` interpolations — plain strings and
 * Postgres-branded `SafeSqlFragment` values are rejected at compile time.
 */
export function safeSql(
  strings: TemplateStringsArray,
  ...interpolated: Array<SafeLogSqlFragment>
): SafeLogSqlFragment {
  return strings.reduce(
    (result, string, i) => result + string + (interpolated[i] ?? ''),
    ''
  ) as SafeLogSqlFragment
}

/**
 * Marks a hand-written log-SQL string as a `SafeLogSqlFragment`. Use only
 * for static SQL authored in source code; never call with arbitrary input.
 */
export function rawSql(sql: string): SafeLogSqlFragment {
  return sql as SafeLogSqlFragment
}

/** Joins already-safe log-SQL fragments with a fixed structural separator. */
export function joinSqlFragments(
  fragments: Array<SafeLogSqlFragment>,
  separator: LogSqlFragmentSeparator
): SafeLogSqlFragment {
  return fragments.join(separator) as SafeLogSqlFragment
}

export function analyticsLiteral(value: string | number | boolean): SafeLogSqlFragment {
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
export function bqIdent(value: string): SafeLogSqlFragment {
  if (typeof value !== 'string' || !SAFE_IDENT_RE.test(value)) {
    throw new Error(`bqIdent: invalid BigQuery identifier "${value}"`)
  }
  return rawSql('`' + value + '`')
}

/** Quote an identifier for ClickHouse using double-quotes. */
export function clickhouseIdent(value: string): SafeLogSqlFragment {
  if (typeof value !== 'string' || !SAFE_IDENT_RE.test(value)) {
    throw new Error(`clickhouseIdent: invalid ClickHouse identifier "${value}"`)
  }
  return rawSql('"' + value + '"')
}
