// SECURITY MODEL — Proven authorship for analytics SQL
//
// Analytics queries (BigQuery for legacy cloud, ClickHouse for self-hosted OTEL)
// carry the same injection risk as Postgres queries: filter keys, values, and
// other fragments that originate from URL parameters, UI inputs, or LLM output
// can be spliced into SQL that is executed on behalf of the project. The pattern
// here mirrors the pg-meta safe-SQL model described in
// .claude/skills/safe-sql-execution/SKILL.md: every value that flows from an
// external source must pass through a sanitization helper before being
// interpolated, and the wire boundary (`executeAnalyticsSql`) refuses plain
// strings at compile time.
//
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
 * - Static strings in source code (no interpolation) via the `safeSql`
 *   template tag with no interpolations
 * - Outputs of `analyticsLiteral`, `quotedIdent`, or `keyword`
 * - Compositions via the `safeSql` template tag (which only accepts
 *   `SafeLogSqlFragment` interpolations)
 * - Compositions via `joinSqlFragments`
 *
 * Never cast arbitrary strings to this type.
 */
export type SafeLogSqlFragment = string & { readonly __safeLogSqlFragmentBrand: never }

type LogSqlFragmentSeparator =
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
 * Internal-only escape hatch for branding hand-written log-SQL produced by
 * the helpers in this file (e.g. `analyticsLiteral`, `quotedIdent`). Not
 * exported: external callers must compose via `safeSql` plus the sanitization
 * helpers, never by casting arbitrary strings.
 */
function rawSql(sql: string): SafeLogSqlFragment {
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
    return value ? safeSql`true` : safeSql`false`
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

/**
 * Validates `value` against an allow-list of pre-branded fragments and returns
 * the matching fragment. Use for SQL operators or keywords where the permitted
 * set is known at compile time (e.g. `keyword(op, [safeSql`AND`, safeSql`OR`])`).
 * Matching is case-insensitive (SQL keywords are case-insensitive by convention);
 * the returned value is always the allow-listed fragment, never the raw input.
 * Throws if `value` does not match any fragment in `allowed`.
 */
export function keyword(value: string, allowed: readonly SafeLogSqlFragment[]): SafeLogSqlFragment {
  const lower = value.toLowerCase()
  const match = allowed.find((frag) => frag.toLowerCase() === lower)
  if (match === undefined) {
    throw new Error(
      `keyword: "${value}" is not in the allowed list [${allowed.map((s) => `"${s}"`).join(', ')}]`
    )
  }
  return match
}

/**
 * Backtick-quotes each segment of a dotted identifier path, validating each against
 * `[A-Za-z_][A-Za-z0-9_]*`. Accepts `a`, `a.b`, or `a.b.c`.
 * Example: `quotedIdent('request.method')` → `` `request`.`method` ``
 *
 * Backticks are accepted by both BigQuery and ClickHouse, so this function serves
 * both engines. Per-segment quoting handles reserved-word segments (e.g. `` `type` ``)
 * and works for table path references and UNNEST alias field accesses alike.
 */
export function quotedIdent(value: string): SafeLogSqlFragment {
  const segments = value.split('.')
  if (segments.length === 0 || segments.some((s) => !SAFE_IDENT_RE.test(s))) {
    throw new Error(`quotedIdent: invalid identifier "${value}"`)
  }
  return rawSql(segments.map((s) => '`' + s + '`').join('.'))
}
