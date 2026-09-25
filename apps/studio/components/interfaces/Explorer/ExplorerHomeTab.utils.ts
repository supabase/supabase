import { removeCommentsFromSql } from '@/lib/helpers'

// [Joshen] `explain` is deliberately excluded even though it's a real SQL keyword - "Explain
// how RLS works" is a common natural-language prompt, and colliding with it would misroute
// a normal chat question into a query tab.
const UNAMBIGUOUS_SQL_STATEMENT_REGEX =
  /^\s*(select|insert|update|delete|alter|drop|truncate|grant|revoke|begin|vacuum|analyze|merge|call|copy|lock|reindex|refresh|execute|prepare|deallocate|comment)\b/i

// `create`, `show`, `set`, and `with` are also common natural-language sentence openers
// ("Create a table for me", "Show me my indexes", "Set up RLS", "With my current schema...").
// Matching the bare keyword alone would misroute those into a query tab, so each requires
// syntax that only shows up in the real SQL statement.
const CREATE_STATEMENT_REGEX =
  /^\s*create\s+(or\s+replace\s+)?(table|unique\s+index|index|view|materialized\s+view|function|procedure|trigger|schema|extension|role|user|policy|type|sequence|database|domain|rule|publication|foreign\s+table)\b/i
const SHOW_STATEMENT_REGEX = /^\s*show\s+(all|[a-zA-Z_][a-zA-Z0-9_.]*)\s*;?\s*$/i
const SET_STATEMENT_REGEX =
  /^\s*set\s+(session\s+|local\s+)?(time\s+zone\b|[a-zA-Z_][a-zA-Z0-9_.]*\s*(=|to)\s*\S)/i
const WITH_STATEMENT_REGEX = /^\s*with\s+(recursive\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s+as\s*\(/i

const isSqlLikeSegment = (segment: string): boolean =>
  UNAMBIGUOUS_SQL_STATEMENT_REGEX.test(segment) ||
  CREATE_STATEMENT_REGEX.test(segment) ||
  SHOW_STATEMENT_REGEX.test(segment) ||
  SET_STATEMENT_REGEX.test(segment) ||
  WITH_STATEMENT_REGEX.test(segment)

/**
 * Whether `message` looks like a SQL statement rather than a natural-language chat prompt,
 * so the Explorer home tab can route it to a query tab instead of creating an AI chat.
 */
export function isSqlStatement(message: string): boolean {
  const sql = removeCommentsFromSql(message).trim()

  const isSimpleStatement =
    UNAMBIGUOUS_SQL_STATEMENT_REGEX.test(sql) ||
    SHOW_STATEMENT_REGEX.test(sql) ||
    SET_STATEMENT_REGEX.test(sql)
  const isComplexStatement = CREATE_STATEMENT_REGEX.test(sql) || WITH_STATEMENT_REGEX.test(sql)

  if (isComplexStatement) return true
  if (!isSimpleStatement) return false

  // Simple statements (select/insert/update/.../show/set) are rarely legitimately
  // multi-paragraph, so a trailing paragraph that doesn't itself look like SQL means
  // this is a chat message that happens to include a query, not a query to run.
  const [, ...trailingParagraphs] = sql.split(/\n\s*\n/)
  return trailingParagraphs.every(isSqlLikeSegment)
}
