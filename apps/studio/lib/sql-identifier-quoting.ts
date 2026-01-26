import { POSTGRESQL_RESERVED_WORDS } from '@supabase/pg-meta/src/pg-format/reserved'

export function needsQuoting(identifier: string): boolean {
  if (POSTGRESQL_RESERVED_WORDS.has(identifier.toUpperCase())) {
    return true
  }

  // Matches valid unquoted identifiers: starts with underscore or lowercase letter,
  // followed by digits, dollar signs, underscores, or lowercase letters
  // Examples: "users", "user_id", "_private", "col$name"
  const validUnquotedPattern = /^[_a-z][\d$_a-z]*$/
  if (validUnquotedPattern.test(identifier)) {
    return false
  }

  return true
}

export function isQuotedInSql(sql: string, identifier: string): boolean {
  // Escapes special regex characters so they're treated literally
  // Examples: "table.name" -> "table\.name", "col(value)" -> "col\(value\)"
  const escapedForRegex = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // PostgreSQL escapes quotes inside quoted identifiers as ""
  const escapedIdentifier = escapedForRegex.replace(/"/g, '""')

  // Matches quoted identifier: "identifier" (case-insensitive)
  // Examples: "MyTable", "my""table" (for identifier "my"table")
  const quotedPattern = new RegExp(`"${escapedIdentifier}"`, 'i')

  return quotedPattern.test(sql)
}
