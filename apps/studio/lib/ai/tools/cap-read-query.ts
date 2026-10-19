import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

import { applyAutoLimit, stripLiteralsAndComments, trimTrailingSemicolons } from '@/data/sql/utils'

const WRAPPABLE_START = /^\s*(\(|select\b|with\b|values\b|table\b)/i
// Statements that can't live inside a subquery (or that write), so they're left untouched
const UNWRAPPABLE = /\b(insert|update|delete|merge|into|for\s+(no\s+key\s+)?(update|share))\b/i

/**
 * Caps a read query at `limit` rows inside the database. Falls back to wrapping the query in a
 * subquery when `applyAutoLimit` can't append a limit (e.g. an explicit large LIMIT or
 * FETCH FIRST, CTEs, trailing comments). Anything that can't be wrapped safely — multiple
 * statements, writes, or text we can't confidently classify — is returned unchanged, so callers
 * must still slice the result.
 */
export function capReadQuery(
  sql: SafeSqlFragment,
  limit: number
): { sql: SafeSqlFragment; isCappedInDatabase: boolean } {
  const auto = applyAutoLimit(sql, limit)
  if (auto.appendAutoLimit) return { sql: auto.sql, isCappedInDatabase: true }

  const core = trimTrailingSemicolons(sql.trim() as SafeSqlFragment)
  const tokens = stripLiteralsAndComments(core)
  // Any remaining `;` means multiple statements (or a literal containing one): don't guess
  if (tokens.includes(';') || !WRAPPABLE_START.test(tokens) || UNWRAPPABLE.test(tokens)) {
    return { sql, isCappedInDatabase: false }
  }

  // Newlines around the query keep a trailing `--` comment from swallowing the closing paren
  const wrapped = safeSql`select * from (\n${core}\n) as capped_result limit ${literal(limit)};`
  return { sql: wrapped, isCappedInDatabase: true }
}
