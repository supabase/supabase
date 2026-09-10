import { removeCommentsFromSql } from '@/lib/helpers'

// [Joshen] `explain` is deliberately excluded even though it's a real SQL keyword - "Explain
// how RLS works" is a common natural-language prompt, and colliding with it would misroute
// a normal chat question into a query tab.
const SQL_STATEMENT_REGEX =
  /^\s*(select|insert|update|delete|create|alter|drop|truncate|with|grant|revoke|begin|vacuum|analyze|merge|call|copy|lock|reindex|refresh|show|set|execute|prepare|deallocate|comment)\b/i

/**
 * Whether `message` looks like a SQL statement rather than a natural-language chat prompt,
 * so the Explorer home tab can route it to a query tab instead of creating an AI chat.
 */
export function isSqlStatement(message: string): boolean {
  return SQL_STATEMENT_REGEX.test(removeCommentsFromSql(message))
}
