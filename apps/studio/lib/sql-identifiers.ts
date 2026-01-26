import type { ColumnRef, Node, RangeVar, ResTarget } from 'libpg-query'

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
