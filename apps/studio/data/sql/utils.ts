import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

/**
 * Pick which lines to render for a SQL editor error.
 *
 * pg-meta returns `formattedError` with multi-line ERROR/HINT/LINE output from Postgres.
 * Historically only `message` was reliably populated end-to-end, which is why the UI also
 * falls back to splitting `message` on newlines — e.g. the enhanced permission-denied HINT
 * added by supabase/postgres#2084 arrives in the message body on some paths.
 *
 * Returns an empty array when the error is single-line (message only) — callers fall back to
 * a plain "Error: {message}" rendering in that case.
 */
export function getSqlErrorLines(error: { message?: string; formattedError?: string }): string[] {
  const formattedLines = (error.formattedError?.split('\n') ?? []).filter((x) => x.length > 0)
  if (formattedLines.length > 0) return formattedLines

  const messageLines = (error.message?.split('\n') ?? []).filter((x) => x.length > 0)
  return messageLines.length > 1 ? messageLines : []
}

/**
 * Removes trailing `;` characters from a safe SQL fragment. Only ever removes
 * existing terminators — never adds text — so the result is exactly as safe
 * as the input; the brand carries over intentionally. This is the one place
 * in the file allowed to reassert `SafeSqlFragment` on a derived string —
 * every other function composes new fragments through `safeSql`/`literal`.
 */
export function trimTrailingSemicolons(sql: SafeSqlFragment): SafeSqlFragment {
  return sql.replace(/;+\s*$/, '') as SafeSqlFragment
}

// [Joshen] Just FYI as well the checks here on whether to append limit is quite restricted
// This is to prevent dashboard from accidentally appending limit to the end of a query
// thats not supposed to have any, since there's too many cases to cover.
// We can however look into making this logic better in the future
// i.e It's harder to append the limit param, than just leaving the query as it is
// Otherwise we'd need a full on parser to do this properly
//
// Only accepts `SafeSqlFragment`: this decides whether to build (and builds)
// a new SQL fragment that gets executed, so every caller — including ones
// that only want the `appendAutoLimit` flag for a display hint — must already
// hold safe SQL. Composes the ` limit N;` suffix through `safeSql`/`literal`
// rather than gluing raw template-literal text onto the fragment and casting
// the result, so the only new content this function ever stamps safe is an
// internally-generated integer literal, never arbitrary concatenated text.
/**
 * Returns true when the SQL is a DML statement (INSERT/UPDATE/DELETE/MERGE/CALL/DO)
 * that does *not* include a RETURNING clause.
 *
 * When this is the case the empty-row result is expected — the query may still have
 * modified rows — so the UI should say "Query ran successfully" rather than the
 * misleading "No rows returned".
 *
 * This is intentionally conservative (plain regex, no full parse):
 * - False negatives (DML with RETURNING detected as non-returning) → safe: we just
 *   fall through to the standard "No rows returned" message.
 * - False positives (SELECT detected as DML) → safe: we'd show a slightly odd
 *   "Query ran successfully" for a SELECT that genuinely returned 0 rows. This can't
 *   happen here because we explicitly exclude SELECT-starting queries.
 */
export function isNonReturningDml(sql: string): boolean {
  const cleaned = sql.trim().replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
  const lower = cleaned.toLowerCase()

  const isDml =
    lower.startsWith('insert') ||
    lower.startsWith('update') ||
    lower.startsWith('delete') ||
    lower.startsWith('merge') ||
    lower.startsWith('call') ||
    lower.startsWith('do')

  if (!isDml) return false

  // A RETURNING clause means Postgres will send back rows, so the empty-row
  // result would correctly mean "0 matched", not "statement ran without output".
  return !lower.includes('returning')
}

export function applyAutoLimit(
  sql: SafeSqlFragment,
  limit: number = 0
): { sql: SafeSqlFragment; appendAutoLimit: boolean } {
  // Remove lines and whitespaces to use for checking
  const cleanedSql = sql.trim().replaceAll('\n', ' ').replaceAll(/\s+/g, ' ')

  // Check how many queries
  const regMatch = cleanedSql.matchAll(/[a-zA-Z]*[0-9]*[;]+/g)
  const queries = new Array(...regMatch)
  const indexSemiColon = cleanedSql.lastIndexOf(';')
  const hasComments = cleanedSql.includes('--')
  const hasMultipleQueries =
    queries.length > 1 || (indexSemiColon > 0 && indexSemiColon !== cleanedSql.length - 1)

  // Check if need to auto limit rows
  const appendAutoLimit =
    limit > 0 &&
    !hasComments &&
    !hasMultipleQueries &&
    cleanedSql.toLowerCase().startsWith('select') &&
    !cleanedSql.toLowerCase().match(/fetch\s+first/i) &&
    !cleanedSql.match(/limit$/i) &&
    !cleanedSql.match(/limit;$/i) &&
    !cleanedSql.match(/limit [0-9]* offset [0-9]*\s*[;]?$/i) &&
    !cleanedSql.match(/limit [0-9]*\s*[;]?$/i)

  if (!appendAutoLimit) return { sql, appendAutoLimit: false }

  const core = cleanedSql.endsWith(';') ? trimTrailingSemicolons(sql) : sql
  const suffixed = safeSql`${core} limit ${literal(limit)};`

  return { sql: suffixed, appendAutoLimit: true }
}
