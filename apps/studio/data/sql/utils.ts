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
 * Strips comments and replaces string literals, dollar-quoted blocks,
 * and quoted identifiers with whitespace. This allows matching executable
 * SQL keywords without false positives from comments or text literals.
 *
 * @param sql - Raw SQL query text
 * @returns Sanitized SQL containing only executable tokens and whitespace
 */
export function stripSqlCommentsAndLiterals(sql: string): string {
  let result = ''
  let i = 0
  const len = sql.length

  while (i < len) {
    // Single-line comment: -- ... until newline
    if (sql[i] === '-' && sql[i + 1] === '-') {
      i += 2
      while (i < len && sql[i] !== '\n' && sql[i] !== '\r') {
        i++
      }
      result += ' '
      continue
    }

    // Multi-line comment: /* ... */ with support for nested comments in Postgres
    if (sql[i] === '/' && sql[i + 1] === '*') {
      i += 2
      let depth = 1
      while (i < len && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth++
          i += 2
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth--
          i += 2
        } else {
          i++
        }
      }
      result += ' '
      continue
    }

    // Dollar-quoted string: $tag$...$tag$ or $$...$$
    if (sql[i] === '$') {
      const match = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/)
      if (match) {
        const tag = match[0]
        const closeIndex = sql.indexOf(tag, i + tag.length)
        if (closeIndex !== -1) {
          i = closeIndex + tag.length
          result += ' '
          continue
        }
      }
    }

    // String literal: ordinary '...' (standard conforming: '' escape only)
    // or E-prefixed escape string E'...' / e'...' (supports \' and \\ escapes)
    const isEscapeStringPrefix =
      (sql[i] === 'E' || sql[i] === 'e') &&
      sql[i + 1] === "'" &&
      (i === 0 || !/[a-zA-Z0-9_]/.test(sql[i - 1]))

    if (isEscapeStringPrefix || sql[i] === "'") {
      const isEscapeString = isEscapeStringPrefix
      if (isEscapeString) {
        i++ // advance past 'E' / 'e'
      }
      i++ // advance past opening quote "'"

      while (i < len) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            i += 2
          } else {
            i++
            break
          }
        } else if (isEscapeString && sql[i] === '\\') {
          i += 2
        } else {
          i++
        }
      }
      result += ' '
      continue
    }

    // Double-quoted identifier: "..." (supports "" escape)
    if (sql[i] === '"') {
      i++
      while (i < len) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            i += 2
          } else {
            i++
            break
          }
        } else {
          i++
        }
      }
      result += ' '
      continue
    }

    result += sql[i]
    i++
  }

  return result
}

/**
 * Extracts the top-level main statement from a SQL query, skipping any leading
 * CTE (Common Table Expression / WITH clause) definitions.
 *
 * Assumes the SQL has already been stripped of comments and literals.
 *
 * @param sql - Cleaned SQL string
 * @returns The main top-level statement following the CTEs, or the original SQL if not a CTE
 */
export function extractMainStatement(sql: string): string {
  const withMatch = sql.match(/^\s*with\b(?:\s+recursive\b)?/i)
  if (!withMatch) return sql

  let i = withMatch[0].length
  let depth = 0
  let inCteBody = false
  let hasClosedCte = false
  const len = sql.length

  const asRe = /\bas\b/iy
  const matRe = /\s*(?:not\s+)?materialized\s*/iy

  while (i < len) {
    const ch = sql[i]

    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
      if (depth === 0 && inCteBody) {
        inCteBody = false
        hasClosedCte = true
      }
    } else if (depth === 0) {
      asRe.lastIndex = i
      if (asRe.test(sql)) {
        i += 2
        // Skip whitespace and optional [NOT] MATERIALIZED
        matRe.lastIndex = i
        const matMatch = matRe.exec(sql)
        if (matMatch) {
          i += matMatch[0].length
        }
        inCteBody = true
        continue
      }

      if (hasClosedCte) {
        if (ch === ',') {
          hasClosedCte = false
        } else if (!/\s/.test(ch)) {
          return sql.slice(i)
        }
      }
    }
    i++
  }

  return sql
}

/**
 * Checks if a SQL statement contains a RETURNING clause at the top level
 * (i.e. not nested inside subquery parentheses).
 *
 * @param sql - Cleaned SQL statement
 * @returns True if a top-level RETURNING clause is present
 */
export function hasTopLevelReturning(sql: string): boolean {
  let depth = 0
  const len = sql.length
  const returningRe = /returning\b/iy

  for (let i = 0; i < len; i++) {
    const ch = sql[i]
    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
    } else if (depth === 0) {
      // Must have a valid left token boundary to prevent matching identifiers like "nonreturning"
      const hasLeftBoundary = i === 0 || !/[a-zA-Z0-9_]/.test(sql[i - 1])
      if (hasLeftBoundary) {
        returningRe.lastIndex = i
        if (returningRe.test(sql)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Returns true when the SQL is a DML statement (INSERT/UPDATE/DELETE/MERGE/CALL/DO)
 * that does *not* include a RETURNING clause, even when preceded by a CTE (WITH clause).
 *
 * When this is the case the empty-row result is expected — the query may still have
 * modified rows — so the UI should say "Query ran successfully" rather than the
 * misleading "No rows returned".
 *
 * Comments, quoted literals, and identifiers are stripped prior to keyword checking
 * to prevent false positives (e.g. 'returning' inside a string literal or '--' inside text).
 *
 * @param sql - The SQL statement to inspect
 * @returns True if the statement is DML without a RETURNING clause
 */
export function isNonReturningDml(sql: string): boolean {
  const cleaned = stripSqlCommentsAndLiterals(sql).trim()
  const main = extractMainStatement(cleaned).trim()

  const isDml = /^\s*(?:insert|update|delete|merge|call|do)\b/i.test(main)
  if (!isDml) return false

  // A top-level RETURNING clause means Postgres will send back rows, so the empty-row
  // result would correctly mean "0 matched", not "statement ran without output".
  return !hasTopLevelReturning(main)
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
