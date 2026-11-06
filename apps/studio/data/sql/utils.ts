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

// Quoted text and comments, matched left to right so a quote inside a comment (or the reverse)
// can't desync the scan: E'..' strings, '..' strings, "..." identifiers, $tag$..$tag$ bodies,
// -- line comments and /* */ block comments
const LITERALS_AND_COMMENTS =
  /\be'(?:[^'\\]|\\.|'')*'|'(?:[^']|'')*'|"(?:[^"]|"")*"|(\$[a-z_]*\$)[\s\S]*?\1|--[^\n]*|\/\*[\s\S]*?\*\//gi

/** Keeps only the SQL tokens, so keywords inside literals and comments aren't mistaken for syntax. */
export const stripLiteralsAndComments = (sql: string) => sql.replace(LITERALS_AND_COMMENTS, ' ')

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

type TokenType =
  | 'comment'
  | 'string'
  | 'identifier'
  | 'word'
  | 'lparen'
  | 'rparen'
  | 'semicolon'
  | 'comma'
  | 'other'

interface Token {
  type: TokenType
  value: string
  upper?: string
}

function tokenizeSql(sql: string): { tokens: Token[]; unclosed: boolean } {
  let i = 0
  const tokens: Token[] = []
  let unclosed = false

  while (i < sql.length) {
    const ch = sql[i]

    // Whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Line comment: --
    if (ch === '-' && sql[i + 1] === '-') {
      const start = i
      i += 2
      while (i < sql.length && sql[i] !== '\n') {
        i++
      }
      tokens.push({ type: 'comment', value: sql.slice(start, i) })
      continue
    }

    // Block comment: /* ... */ (supports nested block comments in Postgres)
    if (ch === '/' && sql[i + 1] === '*') {
      const start = i
      i += 2
      let depth = 1
      while (i < sql.length && depth > 0) {
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
      if (depth > 0) unclosed = true
      tokens.push({ type: 'comment', value: sql.slice(start, i) })
      continue
    }

    // Standard string literal: '...' or escape string E'...'
    if (ch === "'" || ((ch === 'e' || ch === 'E') && sql[i + 1] === "'")) {
      const start = i
      if (ch !== "'") i++ // skip 'e' or 'E'
      i++ // skip opening quote
      let closed = false
      while (i < sql.length) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            i += 2
          } else {
            i++
            closed = true
            break
          }
        } else if (sql[i] === '\\') {
          i += 2
        } else {
          i++
        }
      }
      if (!closed) unclosed = true
      tokens.push({ type: 'string', value: sql.slice(start, i) })
      continue
    }

    // Dollar-quoted string: $tag$...$tag$ or $$...$$
    if (ch === '$') {
      const tagMatch = sql.slice(i).match(/^\$[a-zA-Z0-9_]*\$/)
      if (tagMatch) {
        const tag = tagMatch[0]
        const start = i
        const closeIdx = sql.indexOf(tag, i + tag.length)
        if (closeIdx !== -1) {
          i = closeIdx + tag.length
          tokens.push({ type: 'string', value: sql.slice(start, i) })
          continue
        } else {
          unclosed = true
          tokens.push({ type: 'string', value: sql.slice(start) })
          i = sql.length
          continue
        }
      }
    }

    // Quoted identifier: "..."
    if (ch === '"') {
      const start = i
      i++
      let closed = false
      while (i < sql.length) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            i += 2
          } else {
            i++
            closed = true
            break
          }
        } else {
          i++
        }
      }
      if (!closed) unclosed = true
      tokens.push({ type: 'identifier', value: sql.slice(start, i) })
      continue
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
      continue
    }

    // Semicolon
    if (ch === ';') {
      tokens.push({ type: 'semicolon', value: ';' })
      i++
      continue
    }

    // Comma
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' })
      i++
      continue
    }

    // Word / Keyword / Unquoted identifier
    if (/[a-zA-Z_\u0080-\uFFFF]/.test(ch)) {
      const start = i
      while (i < sql.length && /[a-zA-Z0-9_$\u0080-\uFFFF]/.test(sql[i])) {
        i++
      }
      const val = sql.slice(start, i)
      tokens.push({ type: 'word', value: val, upper: val.toUpperCase() })
      continue
    }

    // Other characters (digits, operators, punctuation)
    tokens.push({ type: 'other', value: ch })
    i++
  }

  return { tokens, unclosed }
}

const DATA_MODIFYING_COMMANDS = new Set(['INSERT', 'UPDATE', 'DELETE', 'MERGE'])

function isLockingClause(token: Token, nextToken?: Token): boolean {
  if (token.type !== 'word' || token.upper !== 'FOR') return false
  if (!nextToken || nextToken.type !== 'word' || !nextToken.upper) return false
  return (
    nextToken.upper === 'UPDATE' ||
    nextToken.upper === 'SHARE' ||
    nextToken.upper === 'NO' ||
    nextToken.upper === 'KEY'
  )
}

function isEligibleForAutoLimit(sql: string, limit: number): boolean {
  if (limit <= 0) return false

  const { tokens, unclosed } = tokenizeSql(sql)
  if (unclosed) return false

  // Fail closed on comments to preserve existing safety behavior
  if (tokens.some((t) => t.type === 'comment')) return false

  // Check multiple queries: any semicolon followed by non-semicolon token
  let seenSemicolon = false
  for (const t of tokens) {
    if (t.type === 'semicolon') {
      seenSemicolon = true
    } else if (seenSemicolon) {
      // Non-semicolon token after a semicolon => multiple statements
      return false
    }
  }

  // Filter out semicolons for statement structure analysis
  const contentTokens = tokens.filter((t) => t.type !== 'semicolon')
  if (contentTokens.length === 0) return false

  // Must start with SELECT or WITH
  const firstToken = contentTokens[0]
  if (firstToken.type !== 'word') return false
  const firstWord = firstToken.upper

  if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
    return false
  }

  // Check balanced parentheses
  let parenDepth = 0
  for (const t of contentTokens) {
    if (t.type === 'lparen') parenDepth++
    else if (t.type === 'rparen') {
      parenDepth--
      if (parenDepth < 0) return false
    }
  }
  if (parenDepth !== 0) return false

  if (firstWord === 'SELECT') {
    // Top-level SELECT query: check if there's already a LIMIT or FETCH at depth 0,
    // or if it's a SELECT INTO or locking clause (FOR UPDATE/SHARE/KEY SHARE)
    let depth = 0
    for (let idx = 0; idx < contentTokens.length; idx++) {
      const t = contentTokens[idx]
      if (t.type === 'lparen') depth++
      else if (t.type === 'rparen') depth--
      else if (depth === 0 && t.type === 'word' && t.upper) {
        if (t.upper === 'LIMIT') return false
        if (t.upper === 'INTO') return false
        if (isLockingClause(t, contentTokens[idx + 1])) return false
        if (t.upper === 'FETCH') {
          const next = contentTokens[idx + 1]
          if (next && next.type === 'word' && (next.upper === 'FIRST' || next.upper === 'NEXT')) {
            return false
          }
        }
      }
    }
    return true
  }

  // First word is WITH: parse CTEs and find main statement
  let idx = 1
  if (
    idx < contentTokens.length &&
    contentTokens[idx].type === 'word' &&
    contentTokens[idx].upper === 'RECURSIVE'
  ) {
    idx++
  }

  // Parse comma-separated CTEs: cte_name [ (cols) ] AS [ [NOT] MATERIALIZED ] ( cte_body ) [ SEARCH ... ] [ CYCLE ... ]
  while (idx < contentTokens.length) {
    // CTE name
    const cteName = contentTokens[idx]
    if (!cteName || (cteName.type !== 'word' && cteName.type !== 'identifier')) {
      return false
    }
    idx++

    // Optional column list: (col1, col2, ...)
    if (idx < contentTokens.length && contentTokens[idx].type === 'lparen') {
      let depth = 1
      idx++
      while (idx < contentTokens.length && depth > 0) {
        if (contentTokens[idx].type === 'lparen') depth++
        else if (contentTokens[idx].type === 'rparen') depth--
        idx++
      }
    }

    // AS keyword
    if (
      idx >= contentTokens.length ||
      contentTokens[idx].type !== 'word' ||
      contentTokens[idx].upper !== 'AS'
    ) {
      return false
    }
    idx++

    // Optional [NOT] MATERIALIZED
    if (
      idx < contentTokens.length &&
      contentTokens[idx].type === 'word' &&
      contentTokens[idx].upper === 'NOT'
    ) {
      idx++
    }
    if (
      idx < contentTokens.length &&
      contentTokens[idx].type === 'word' &&
      contentTokens[idx].upper === 'MATERIALIZED'
    ) {
      idx++
    }

    // CTE body must open with '('
    if (idx >= contentTokens.length || contentTokens[idx].type !== 'lparen') {
      return false
    }
    idx++ // consume '('

    // Scan CTE body until matching ')'
    let bodyDepth = 1
    const cteTokens: Token[] = []
    while (idx < contentTokens.length && bodyDepth > 0) {
      const t = contentTokens[idx]
      if (t.type === 'lparen') bodyDepth++
      else if (t.type === 'rparen') {
        bodyDepth--
        if (bodyDepth === 0) {
          idx++ // consume closing ')'
          break
        }
      }
      cteTokens.push(t)
      idx++
    }
    if (bodyDepth !== 0) return false

    // Check if CTE body contains data-modifying statements or row-locking clauses
    for (let k = 0; k < cteTokens.length; k++) {
      const t = cteTokens[k]
      if (t.type === 'word' && t.upper) {
        if (DATA_MODIFYING_COMMANDS.has(t.upper)) return false
        if (isLockingClause(t, cteTokens[k + 1])) return false
      }
    }

    // Optional SEARCH or CYCLE clauses
    while (
      idx < contentTokens.length &&
      contentTokens[idx].type === 'word' &&
      (contentTokens[idx].upper === 'SEARCH' || contentTokens[idx].upper === 'CYCLE')
    ) {
      while (
        idx < contentTokens.length &&
        contentTokens[idx].type !== 'comma' &&
        contentTokens[idx].type !== 'lparen' &&
        !(
          contentTokens[idx].type === 'word' &&
          (contentTokens[idx].upper === 'SELECT' ||
            contentTokens[idx].upper === 'INSERT' ||
            contentTokens[idx].upper === 'UPDATE' ||
            contentTokens[idx].upper === 'DELETE' ||
            contentTokens[idx].upper === 'TABLE' ||
            contentTokens[idx].upper === 'VALUES')
        )
      ) {
        idx++
      }
    }

    // Next token: if comma, another CTE follows
    if (idx < contentTokens.length && contentTokens[idx].type === 'comma') {
      idx++ // consume comma, loop to next CTE
      continue
    }

    // Otherwise, CTE definitions have ended
    break
  }

  // Now idx should be at the start of the main statement
  if (idx >= contentTokens.length) return false

  let mainParenDepth = 0
  let mainFirstWord: string | null = null
  const mainStartIdx = idx

  // Find first keyword of main statement
  while (idx < contentTokens.length) {
    const t = contentTokens[idx]
    if (t.type === 'lparen') {
      mainParenDepth++
      idx++
    } else if (t.type === 'word' && t.upper) {
      mainFirstWord = t.upper
      break
    } else {
      return false
    }
  }

  // Main statement must be a SELECT
  if (mainFirstWord !== 'SELECT') {
    return false
  }

  // Check if main statement already has a limit at its outer level,
  // or if it's a SELECT INTO or locking clause (FOR UPDATE/SHARE/KEY SHARE)
  let depth = 0
  for (let j = mainStartIdx; j < contentTokens.length; j++) {
    const t = contentTokens[j]
    if (t.type === 'lparen') depth++
    else if (t.type === 'rparen') depth--
    else if (depth <= mainParenDepth && t.type === 'word' && t.upper) {
      if (t.upper === 'LIMIT') return false
      if (t.upper === 'INTO') return false
      if (isLockingClause(t, contentTokens[j + 1])) return false
      if (t.upper === 'FETCH') {
        const next = contentTokens[j + 1]
        if (next && next.type === 'word' && (next.upper === 'FIRST' || next.upper === 'NEXT')) {
          return false
        }
      }
    }
  }

  return true
}

export function applyAutoLimit(
  sql: SafeSqlFragment,
  limit: number = 0
): { sql: SafeSqlFragment; appendAutoLimit: boolean } {
  const appendAutoLimit = isEligibleForAutoLimit(sql, limit)

  if (!appendAutoLimit) return { sql, appendAutoLimit: false }

  const hasTrailingSemicolon = /;+\s*$/.test(sql)
  const core = hasTrailingSemicolon ? trimTrailingSemicolons(sql) : sql
  const suffixed = safeSql`${core} limit ${literal(limit)};`

  return { sql: suffixed, appendAutoLimit: true }
}
