import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

import type { SupaTable } from '@/components/grid/types'

export type TableEditorActiveFilter = {
  column: string
  operator: string
  value: string
}

export function getQuickFilterColumns(table: SupaTable): string[] {
  const columnNames = new Set(table.columns.map((column) => column.name))
  const resolved: string[] = []

  const primaryKeyColumn = table.primaryKey?.length === 1 ? table.primaryKey[0] : null
  if (primaryKeyColumn && columnNames.has(primaryKeyColumn)) {
    resolved.push(primaryKeyColumn)
  } else if (columnNames.has('id')) {
    resolved.push('id')
  }

  for (const name of ['name', 'email'] as const) {
    if (columnNames.has(name)) {
      resolved.push(name)
    }
  }

  return [...new Set(resolved)]
}

export function buildTableEditorActiveFilter(
  table: SupaTable,
  value: string,
): TableEditorActiveFilter | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const columns = getQuickFilterColumns(table)
  const displayColumn = columns.includes('name') ? 'name' : (columns[0] ?? 'name')

  return {
    column: displayColumn,
    operator: '~~*',
    value: trimmed,
  }
}

export function buildQuickFilterWhereClause(
  table: SupaTable,
  query: string,
): SafeSqlFragment | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  const columns = getQuickFilterColumns(table)
  if (columns.length === 0) return null

  const pattern = `%${trimmed}%`
  const conditions = columns.map((column) =>
    safeSql`${ident(column)}::text ilike ${literal(pattern)}`
  )

  return safeSql`(${joinSqlFragments(conditions, ' or ')})`
}

export type TableEditorQuickFilter = {
  columns: string[]
  value: string
}

export function buildTableEditorQuickFilter(
  table: SupaTable,
  value: string,
): TableEditorQuickFilter | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const columns = getQuickFilterColumns(table)
  if (columns.length === 0) return null

  return { columns, value: trimmed }
}
