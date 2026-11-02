import type { Filter, SupaRow } from '@/components/grid/types'
import { convertByteaToHex } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'

type ForeignKeyColumns = Pick<ForeignKeyConstraint, 'source_columns' | 'target_columns'>

/**
 * Finds the foreign key constraint on `schema.table` that includes `columnName`
 * among its source columns.
 */
export function findColumnForeignKeyConstraint({
  foreignKeys,
  schema,
  table,
  columnName,
}: {
  foreignKeys: ForeignKeyConstraint[]
  schema: string
  table: string
  columnName: string
}): ForeignKeyConstraint | undefined {
  return foreignKeys.find(
    (foreignKey) =>
      foreignKey.source_schema === schema &&
      foreignKey.source_table === table &&
      foreignKey.source_columns.includes(columnName)
  )
}

/**
 * Builds the filters that identify the record `row` references through
 * `foreignKey`. Source and target columns are paired by their ordinal position
 * in the constraint, so a composite foreign key filters on every column of the
 * referenced table, each with the value from its own paired source column.
 *
 * Returns an empty array when any source value is null or missing: with the
 * default MATCH SIMPLE semantics, a row with a null foreign key column does not
 * reference any record.
 */
export function getReferencingRecordFilters({
  foreignKey,
  row,
  columns,
}: {
  foreignKey: ForeignKeyColumns
  row: SupaRow
  columns: { name: string; format: string }[]
}): Filter[] {
  if (
    foreignKey.source_columns.length === 0 ||
    foreignKey.source_columns.length !== foreignKey.target_columns.length
  ) {
    return []
  }

  const filters: Filter[] = []

  for (const [index, sourceColumn] of foreignKey.source_columns.entries()) {
    const value = row[sourceColumn]
    if (value === null || value === undefined) return []

    const format = columns.find((column) => column.name === sourceColumn)?.format
    filters.push({
      column: foreignKey.target_columns[index],
      operator: '=',
      value: format === 'bytea' ? convertByteaToHex(value) : value,
    })
  }

  return filters
}
