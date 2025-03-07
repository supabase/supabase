import { SupaTable } from 'components/grid/types'
import pgMeta from '@supabase/pg-meta'
import { PGTable } from '@supabase/pg-meta/src/pg-meta-tables'
import {
  Filter,
  Sort,
  ADDITIONAL_LARGE_TYPES as PG_META_LARGE_TYPES,
  MAX_CHARACTERS as PG_META_MAX_CHARACTERS,
} from '@supabase/pg-meta/src/pg-meta-table-rows-query'

/**
 * Utility function to convert a SupaTable to a PGTable
 * This is needed to bridge the two data models while migrating
 */
export function convertToPGTable(supaTable: SupaTable): PGTable {
  return {
    id: supaTable.id,
    schema: supaTable.schema || 'public',
    name: supaTable.name,
    rls_enabled: false,
    rls_forced: false,
    replica_identity: 'DEFAULT',
    bytes: 0,
    size: '0 bytes',
    live_rows_estimate: supaTable.estimateRowCount || 0,
    dead_rows_estimate: 0,
    comment: null,
    primary_keys: supaTable.columns
      .filter((col) => col.isPrimaryKey)
      .map((col) => ({
        table_id: supaTable.id,
        name: col.name,
        schema: supaTable.schema || 'public',
        table_name: supaTable.name,
      })),
    relationships: [],
    columns: supaTable.columns.map((col) => ({
      id: `${supaTable.id}.${col.name}`,
      table_id: supaTable.id,
      schema: supaTable.schema || 'public',
      table: supaTable.name,
      name: col.name,
      ordinal_position: col.position || 0,
      data_type: col.dataType,
      format: col.format,
      is_identity: false,
      identity_generation: null,
      is_generated: false,
      is_nullable: col.isNullable || true, // Default to true if not specified
      is_updatable: true,
      is_unique: col.isPrimaryKey || false, // This is an approximation
      check: null,
      default_value: col.defaultValue || null,
      enums: (col as any).enum || [],
      comment: null,
    })),
  }
}

/**
 * Convert from Studio format to pg-meta format
 */
export function convertToFilter(filter: any): Filter {
  return {
    column: filter.column,
    operator: filter.operator,
    value: filter.value,
  }
}

/**
 * Convert from Studio format to pg-meta format
 */
export function convertToSort(sort: any): Sort {
  return {
    column: sort.column,
    table: sort.table,
    ascending: sort.ascending,
    nullsFirst: sort.nullsFirst,
  }
}

/**
 * Build a query for fetching table rows using pg-meta
 * This is a drop-in replacement for buildTableRowsQuery in table-rows-select-query-builder.ts
 */
export function buildTableRowsQuery({
  table,
  filters,
  sorts,
  page,
  limit,
}: {
  table: SupaTable
  filters?: any[]
  sorts?: any[]
  limit?: number
  page?: number
}): string {
  if (!table) return ''

  const pgTable = convertToPGTable(table)
  const pgFilters = filters ? filters.map(convertToFilter) : undefined
  const pgSorts = sorts ? sorts.map(convertToSort) : undefined

  return pgMeta.tableRowsQuery.buildTableRowsQuery({
    table: pgTable,
    filters: pgFilters,
    sorts: pgSorts,
    page,
    limit,
  })
}

/**
 * Determine if a column should be truncated
 */
export function shouldTruncateColumn(column: any): boolean {
  return pgMeta.tableRowsQuery.shouldTruncateColumn(column)
}

// Export other necessary functions to maintain API compatibility
export const getDefaultOrderByColumns = (table: SupaTable) => {
  return pgMeta.tableRowsQuery.getDefaultOrderByColumns(convertToPGTable(table))
}

// Re-export constants
export const MAX_CHARACTERS = PG_META_MAX_CHARACTERS
export const ADDITIONAL_LARGE_TYPES = PG_META_LARGE_TYPES
