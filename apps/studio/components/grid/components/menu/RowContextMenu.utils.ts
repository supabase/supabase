import { Query } from '@supabase/pg-meta/src/query'

import type { SupaRow, SupaTable } from 'components/grid/types'

import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'

export const getEnumArrayColumns = (table: SupaTable) =>
  table.columns
    .filter(
      (column) => (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
    )
    .map((column) => column.name)

const getSinglePrimaryKeyColumn = (table: SupaTable) => {
  const primaryKeyColumns = table.columns.filter((column) => column.isPrimaryKey)
  return primaryKeyColumns.length === 1 ? primaryKeyColumns[0] : undefined
}

export const maybeAddGeneratedUuidPrimaryKeyForDuplicate = ({
  table,
  payload,
}: {
  table: SupaTable
  payload: Record<string, any>
}): { payload: Record<string, any>; generated: boolean } => {
  const primaryKeyColumn = getSinglePrimaryKeyColumn(table)
  if (!primaryKeyColumn) return { payload, generated: false }

  const shouldGeneratePrimaryKey =
    primaryKeyColumn.format === 'uuid' &&
    primaryKeyColumn.isNullable === false &&
    !primaryKeyColumn.defaultValue &&
    !primaryKeyColumn.isIdentity

  if (!shouldGeneratePrimaryKey) return { payload, generated: false }
  if (primaryKeyColumn.name in payload) return { payload, generated: false }

  const randomUUID =
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    'randomUUID' in globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
      : undefined

  if (!randomUUID) return { payload, generated: false }

  return {
    payload: { ...payload, [primaryKeyColumn.name]: randomUUID() },
    generated: true,
  }
}

export const isLikelyMissingPrimaryKeyError = ({
  error,
  table,
}: {
  error: any
  table: SupaTable
}): boolean => {
  const primaryKeyColumn = getSinglePrimaryKeyColumn(table)
  if (!primaryKeyColumn) return false

  const message = (error?.message ?? '').toString().toLowerCase()
  const columnName = `"${primaryKeyColumn.name}"`.toLowerCase()

  // Postgres not-null violation messages often look like:
  // `null value in column "id" violates not-null constraint`
  return (
    message.includes('null value in column') &&
    message.includes(columnName) &&
    message.includes('violates not-null constraint')
  )
}

export const buildDuplicateRowPayload = ({
  table,
  row,
}: {
  table: SupaTable
  row: SupaRow
}): Record<string, any> => {
  const payload: Record<string, any> = {}

  for (const column of table.columns) {
    // Avoid inserting values that will almost always break duplication
    // (PK collisions, identity/generator columns, generated columns).
    if (column.isPrimaryKey) continue
    if (column.isIdentity) continue
    if (column.isGeneratable) continue
    if (column.defaultValue != null) continue
    if (column.isUpdatable === false) continue

    if (!(column.name in row)) continue

    const value = row[column.name]
    if (
      column.format === 'bytea' &&
      value &&
      typeof value === 'object' &&
      value.type === 'Buffer' &&
      Array.isArray(value.data)
    ) {
      payload[column.name] = convertByteaToHex(value)
    } else {
      payload[column.name] = value
    }
  }

  return payload
}

const normalizeRowValueForFilter = (columnFormat: string, value: any) => {
  if (
    columnFormat === 'bytea' &&
    value &&
    typeof value === 'object' &&
    value.type === 'Buffer' &&
    Array.isArray(value.data)
  ) {
    return convertByteaToHex(value)
  }

  return value
}

export const fetchFullRowForDuplicate = async ({
  projectRef,
  connectionString,
  table,
  row,
  roleImpersonationState,
}: {
  projectRef: string
  connectionString?: string | null
  table: SupaTable
  row: SupaRow
  roleImpersonationState?: RoleImpersonationState
}): Promise<SupaRow> => {
  const primaryKeyColumns = table.columns.filter((column) => column.isPrimaryKey)
  const query = new Query().from(table.name, table.schema ?? undefined).select()

  if (primaryKeyColumns.length > 0) {
    for (const column of primaryKeyColumns) {
      if (!(column.name in row)) {
        throw new Error('Cannot duplicate row: primary key value is missing')
      }
      const value = normalizeRowValueForFilter(column.format, row[column.name])
      if (value === null || value === undefined) {
        throw new Error('Cannot duplicate row: primary key value is missing')
      }
      query.filter(column.name, '=', value)
    }
  } else if ('ctid' in row) {
    query.filter('ctid', '=', (row as any).ctid)
  } else {
    throw new Error('Cannot duplicate row without a primary key or ctid')
  }

  const sql = wrapWithRoleImpersonation(query.toSql(), roleImpersonationState)
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
  })

  const fullRow = Array.isArray(result) ? result[0] : undefined
  if (!fullRow) {
    throw new Error('Could not fetch full row for duplication')
  }

  return { ...fullRow, idx: row.idx } as SupaRow
}
