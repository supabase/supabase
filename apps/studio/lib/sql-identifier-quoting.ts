import type { ColumnDef, ColumnRef, Node, RangeVar, ResTarget } from 'libpg-query'
import { POSTGRESQL_RESERVED_WORDS } from '@supabase/pg-meta/src/pg-format/reserved'

/**
 * Recursively traverse a libpg-query AST to extract all identifiers.
 * Collects table names from RangeVar and column names from ColumnRef/ResTarget.
 */
export function extractIdentifiers(ast: Node | Node[]): string[] {
  const identifiers: string[] = []

  function extractFromRangeVar(rv: RangeVar): void {
    if (rv.relname) identifiers.push(rv.relname)
    if (rv.schemaname) identifiers.push(rv.schemaname)
  }

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const obj = node as Record<string, unknown>

    // RangeVar - table references (wrapped form in SELECT)
    if ('RangeVar' in obj) {
      extractFromRangeVar(obj.RangeVar as RangeVar)
    }

    // relation - table references (unwrapped form in INSERT/UPDATE/DELETE)
    if ('relation' in obj && obj.relation && typeof obj.relation === 'object') {
      extractFromRangeVar(obj.relation as RangeVar)
    }

    // ColumnRef - column references in expressions
    if ('ColumnRef' in obj) {
      const cr = obj.ColumnRef as ColumnRef
      for (const field of cr.fields ?? []) {
        if ('String' in field) {
          const str = field.String as { sval?: string }
          if (str.sval) identifiers.push(str.sval)
        }
      }
    }

    // ResTarget - column targets in INSERT/UPDATE
    if ('ResTarget' in obj) {
      const rt = obj.ResTarget as ResTarget
      if (rt.name) identifiers.push(rt.name)
    }

    // ColumnDef - column definitions in CREATE TABLE
    if ('ColumnDef' in obj) {
      const cd = obj.ColumnDef as ColumnDef
      if (cd.colname) identifiers.push(cd.colname)
    }

    // Recurse into all values
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        value.forEach(traverse)
      } else {
        traverse(value)
      }
    }
  }

  traverse(ast)
  return identifiers
}

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
