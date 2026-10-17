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

// Recognize an outer LIMIT ALL/NULL without interpreting the rest of the SQL.
// OFFSET accepts expressions, so a suffix regex cannot reliably identify these
// clauses. Ignore quoted text, comments, and parenthesized subqueries while
// looking for the two keywords; leave all other auto-limit rules unchanged.
function hasOuterUnlimitedLimit(sql: string): boolean {
  let depth = 0
  let previousWord = ''

  for (let i = 0; i < sql.length; ) {
    const char = sql[i]
    const next = sql[i + 1]
    const dollarQuote = char === '$' ? /^\$(?:[a-zA-Z_]\w*)?\$/.exec(sql.slice(i)) : null

    if (char === '-' && next === '-') {
      const end = sql.indexOf('\n', i + 2)
      i = end < 0 ? sql.length : end + 1
    } else if (char === '/' && next === '*') {
      let commentDepth = 1
      i += 2
      while (i < sql.length && commentDepth > 0) {
        if (sql.startsWith('/*', i)) {
          commentDepth++
          i += 2
        } else if (sql.startsWith('*/', i)) {
          commentDepth--
          i += 2
        } else {
          i++
        }
      }
    } else if (char === "'" || char === '"') {
      const quote = char
      const escapeString =
        quote === "'" && /[eE]/.test(sql[i - 1] ?? '') && !/[\w$]/.test(sql[i - 2] ?? '')
      previousWord = ''
      i++
      while (i < sql.length) {
        if (escapeString && sql[i] === '\\') i += 2
        else if (sql[i] === quote && sql[i + 1] === quote) i += 2
        else if (sql[i++] === quote) break
      }
    } else if (dollarQuote) {
      const delimiter = dollarQuote[0]
      const end = sql.indexOf(delimiter, i + delimiter.length)
      previousWord = ''
      i = end < 0 ? sql.length : end + delimiter.length
    } else if (/[a-zA-Z_]/.test(char)) {
      const start = i
      while (i < sql.length && /[\w$]/.test(sql[i])) i++
      const word = sql.slice(start, i).toLowerCase()
      if (depth === 0 && previousWord === 'limit' && (word === 'all' || word === 'null')) {
        return true
      }
      previousWord = depth === 0 ? word : ''
    } else {
      if (char === '(') depth++
      if (char === ')') depth--
      if (!/\s/.test(char)) previousWord = ''
      i++
    }
  }

  return false
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
    !cleanedSql.toLowerCase().match(/fetch\s+(first|next)/i) &&
    !cleanedSql.match(/limit$/i) &&
    !cleanedSql.match(/limit;$/i) &&
    !hasOuterUnlimitedLimit(sql) &&
    !cleanedSql.match(/limit [0-9]* offset [0-9]*\s*[;]?$/i) &&
    !cleanedSql.match(/limit [0-9]*\s*[;]?$/i)

  if (!appendAutoLimit) return { sql, appendAutoLimit: false }

  const core = cleanedSql.endsWith(';') ? trimTrailingSemicolons(sql) : sql
  const suffixed = safeSql`${core} limit ${literal(limit)};`

  return { sql: suffixed, appendAutoLimit: true }
}
