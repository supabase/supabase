import * as Sentry from '@sentry/nextjs'
import type { PGTablePrimaryKey } from '@supabase/pg-meta'
import pgMeta, {
  getAddForeignKeySQL,
  getAddPrimaryKeySQL,
  getDropConstraintSQL,
  getDuplicateIdentitySequenceSQL,
  getDuplicateRowsSQL,
  getDuplicateTableSQL,
  getEnableRLSSQL,
  getRemoveForeignKeySQL,
  getUpdateIdentitySequenceSQL,
  type ForeignKey,
} from '@supabase/pg-meta'
import { joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
import { Query } from '@supabase/pg-meta/src/query'
import { chunk, find, isEmpty, isEqual } from 'lodash'
import Papa from 'papaparse'
import { toast } from 'sonner'

import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor/ColumnEditor.utils'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import { checkIfRelationChanged } from './TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'
import type { ImportContent } from './TableEditor/TableEditor.types'
import type { SupaRow } from '@/components/grid/types'
import { SparkBar } from '@/components/ui/SparkBar'
import { createDatabaseColumn } from '@/data/database-columns/database-column-create-mutation'
import { deleteDatabaseColumn } from '@/data/database-columns/database-column-delete-mutation'
import { updateDatabaseColumn } from '@/data/database-columns/database-column-update-mutation'
import type { Constraint } from '@/data/database/constraints-query'
import { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import { prefetchEditorTablePage } from '@/data/prefetchers/project.$ref.editor.$id'
import { getQueryClient } from '@/data/query-client'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { prefetchTableEditor } from '@/data/table-editor/table-editor-query'
import { executeWithRetry } from '@/data/table-rows/table-rows-query'
import { tableKeys } from '@/data/tables/keys'
import { invalidateTableMetadata } from '@/data/tables/table-metadata-invalidation'
import { getTable, getTableQuery, RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import {
  UpdateTableBody,
  updateTable as updateTableMutation,
} from '@/data/tables/table-update-mutation'
import { getTables } from '@/data/tables/tables-query'
import { isObject, isObjectContainingKeys, timeout, tryParseJson } from '@/lib/helpers'
import type { SafePostgresColumn } from '@/lib/postgres-types'
import type { useTrack } from '@/lib/telemetry/track'
import type { DeepReadonly } from '@/lib/type-helpers'
import type { SidePanel } from '@/state/table-editor'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

type Track = ReturnType<typeof useTrack>

/**
 * Extracts the row data from the current side panel state.
 * Used when queuing cell edit operations to get the row being edited.
 * Accepts both mutable and readonly (valtio snapshot) versions of SidePanel.
 *
 * @param sidePanel - The current side panel state (can be readonly from valtio snapshot)
 * @returns The row data if available, undefined otherwise
 */
export function getRowFromSidePanel(
  sidePanel: SidePanel | DeepReadonly<SidePanel> | undefined
): SupaRow | undefined {
  if (!sidePanel) return undefined

  switch (sidePanel.type) {
    case 'json':
      return sidePanel.jsonValue.row as SupaRow | undefined
    case 'cell':
      return sidePanel.value?.row as SupaRow | undefined
    case 'row':
      return sidePanel.row as SupaRow | undefined
    case 'foreign-row-selector':
      return sidePanel.foreignKey.row as SupaRow | undefined
    default:
      return undefined
  }
}

const addPrimaryKey = async (
  projectRef: string,
  connectionString: string | undefined | null,
  schema: string,
  table: string,
  columns: string[]
) => {
  const query = getAddPrimaryKeySQL({ schema, table, columns })
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['primary-keys'],
  })
}

const dropConstraint = async (
  projectRef: string,
  connectionString: string | undefined | null,
  schema: string,
  table: string,
  name: string
) => {
  const query = getDropConstraintSQL({ schema, table, name })
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['drop-constraint'],
  })
}

const addForeignKey = async ({
  projectRef,
  connectionString,
  table,
  foreignKeys,
}: {
  projectRef: string
  connectionString?: string | null
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = getAddForeignKeySQL({ table, foreignKeys })
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

const removeForeignKey = async ({
  projectRef,
  connectionString,
  table,
  foreignKeys,
}: {
  projectRef: string
  connectionString?: string | null
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = getRemoveForeignKeySQL({ table, foreignKeys })
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

const updateForeignKey = async ({
  projectRef,
  connectionString,
  table,
  foreignKeys,
}: {
  projectRef: string
  connectionString?: string | null
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = safeSql`${getRemoveForeignKeySQL({ table, foreignKeys })} ${getAddForeignKeySQL({ table, foreignKeys })}`
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

/**
 * The methods below involve several contexts due to the UI flow of the
 * dashboard and hence do not sit within their own stores
 */

/** TODO: Refactor to do in a single transaction */
export const createColumn = async ({
  projectRef,
  connectionString,
  payload,
  selectedTable,
  primaryKey,
  foreignKeyRelations = [],
  skipSuccessMessage = false,
  toastId: _toastId,
}: {
  projectRef: string
  connectionString?: string | null
  payload: CreateColumnPayload
  selectedTable: RetrieveTableResult
  primaryKey?: Constraint
  foreignKeyRelations?: ForeignKey[]
  skipSuccessMessage?: boolean
  toastId?: string | number
}) => {
  const toastId = _toastId ?? toast.loading(`Creating column "${payload.name}"...`)
  try {
    const { isPrimaryKey, ...formattedPayload } = payload
    const sqlStatements: Array<SafeSqlFragment> = []

    const { sql: createColumnSql } = pgMeta.columns.create({
      schema: formattedPayload.schema,
      table: formattedPayload.table,
      name: formattedPayload.name,
      type: formattedPayload.type,
      default_value: formattedPayload.defaultValue,
      default_value_format: formattedPayload.defaultValueFormat,
      is_identity: formattedPayload.isIdentity,
      identity_generation: formattedPayload.identityGeneration,
      is_nullable: formattedPayload.isNullable,
      is_unique: formattedPayload.isUnique,
      comment: formattedPayload.comment,
      check: formattedPayload.check,
      no_transaction: true,
    })
    sqlStatements.push(createColumnSql)

    // Firing createColumn in createTable will bypass this block
    if (isPrimaryKey) {
      toast.loading('Assigning primary key to column...', { id: toastId })
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        sqlStatements.push(
          getDropConstraintSQL({
            schema: payload.schema,
            table: payload.table,
            name: primaryKey.name,
          })
        )
      }

      const primaryKeyColumns = existingPrimaryKeys.concat([formattedPayload.name])
      sqlStatements.push(
        getAddPrimaryKeySQL({
          schema: payload.schema,
          table: payload.table,
          columns: primaryKeyColumns,
        })
      )
    }

    if (foreignKeyRelations.length > 0) {
      const fkSql = getAddForeignKeySQL({
        table: { schema: payload.schema, name: payload.table },
        foreignKeys: foreignKeyRelations,
      })
      sqlStatements.push(fkSql.replace(/;+$/, '') as SafeSqlFragment)
    }

    await Sentry.startSpan(
      { name: 'create_column.execute_sql', op: 'db.sql.transaction' },
      async (span) => {
        span.setAttribute('sql.statement_count', sqlStatements.length)
        await executeSql({
          projectRef,
          connectionString,
          sql: safeSql`BEGIN; ${joinSqlFragments(sqlStatements, ';\n')}; COMMIT;`,
          queryKey: ['column', 'create'],
        })
      }
    )

    if (!skipSuccessMessage) {
      toast.success(`Successfully created column "${formattedPayload.name}"`, { id: toastId })
    }
    return { error: undefined }
  } catch (error) {
    toast.error(`An error occurred while creating the column "${payload.name}"`, { id: toastId })
    return { error }
  }
}

/** TODO: Refactor to do in a single transaction */
export const updateColumn = async ({
  projectRef,
  connectionString,
  originalColumn,
  payload,
  selectedTable,
  primaryKey,
  foreignKeyRelations = [],
  existingForeignKeyRelations = [],
  skipPKCreation,
  skipSuccessMessage = false,
}: {
  projectRef: string
  connectionString?: string | null
  originalColumn: DeepReadonly<SafePostgresColumn>
  payload: UpdateColumnPayload
  selectedTable: RetrieveTableResult
  primaryKey?: Constraint
  foreignKeyRelations?: ForeignKey[]
  existingForeignKeyRelations?: ForeignKeyConstraint[]
  skipPKCreation?: boolean
  skipSuccessMessage?: boolean
}) => {
  try {
    const { isPrimaryKey, ...formattedPayload } = payload
    const sqlStatements: Array<SafeSqlFragment> = []

    const { sql: updateColumnSql } = pgMeta.columns.update(originalColumn, {
      name: formattedPayload.name,
      type: formattedPayload.type,
      drop_default: formattedPayload.dropDefault,
      default_value: formattedPayload.defaultValue,
      default_value_format: formattedPayload.defaultValueFormat,
      is_identity: formattedPayload.isIdentity,
      identity_generation: formattedPayload.identityGeneration,
      is_nullable: formattedPayload.isNullable,
      is_unique: formattedPayload.isUnique,
      comment: formattedPayload.comment,
      check: formattedPayload.check,
    })
    sqlStatements.push(updateColumnSql)

    if (!skipPKCreation && isPrimaryKey !== undefined) {
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      // Primary key is getting updated for the column
      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        sqlStatements.push(
          getDropConstraintSQL({
            schema: originalColumn.schema,
            table: originalColumn.table,
            name: primaryKey.name,
          })
        )
      }

      const columnName = formattedPayload.name ?? originalColumn.name
      const primaryKeyColumns = isPrimaryKey
        ? existingPrimaryKeys.concat([columnName])
        : existingPrimaryKeys.filter((x) => x !== columnName)

      if (primaryKeyColumns.length) {
        sqlStatements.push(
          getAddPrimaryKeySQL({
            schema: originalColumn.schema,
            table: originalColumn.table,
            columns: primaryKeyColumns,
          })
        )
      }
    }

    // Then update foreign keys
    if (foreignKeyRelations.length > 0) {
      const fkSqls = getUpdateForeignKeysSQL({
        table: { schema: originalColumn.schema, name: originalColumn.table },
        foreignKeys: foreignKeyRelations,
        existingForeignKeyRelations,
      })
      sqlStatements.push(...fkSqls)
    }

    await Sentry.startSpan(
      { name: 'update_column.execute_sql', op: 'db.sql.transaction' },
      async (span) => {
        span.setAttribute('sql.statement_count', sqlStatements.length)
        await executeSql({
          projectRef,
          connectionString,
          sql: safeSql`BEGIN; ${joinSqlFragments(sqlStatements, ';\n')}; COMMIT;`,
          queryKey: ['column', 'update', originalColumn.id],
        })
      }
    )

    if (!skipSuccessMessage) toast.success(`Successfully updated column "${originalColumn.name}"`)
  } catch (error: any) {
    return { error }
  }
}

/** TODO: Refactor to do in a single transaction */
export const duplicateTable = async (
  projectRef: string,
  connectionString: string | undefined | null,
  payload: { name: string; comment?: string | null },
  metadata: {
    duplicateTable: RetrieveTableResult
    isRLSEnabled: boolean
    isDuplicateRows: boolean
    foreignKeyRelations: ForeignKey[]
  }
) => {
  const queryClient = getQueryClient()
  const { duplicateTable, isRLSEnabled, isDuplicateRows, foreignKeyRelations } = metadata
  const { name: sourceTableName, schema: sourceTableSchema } = duplicateTable
  const duplicatedTableName = payload.name
  const sqlStatements: Array<SafeSqlFragment> = []

  sqlStatements.push(
    getDuplicateTableSQL({
      sourceTableName,
      sourceTableSchema,
      duplicatedTableName,
      comment: payload.comment,
    })
  )

  if (foreignKeyRelations.length > 0) {
    const fkSql = getAddForeignKeySQL({
      table: { ...duplicateTable, name: payload.name },
      foreignKeys: foreignKeyRelations,
    })
    sqlStatements.push(fkSql.replace(/;+$/, '') as SafeSqlFragment)
  }

  if (isDuplicateRows) {
    sqlStatements.push(
      getDuplicateRowsSQL({
        sourceTableName,
        sourceTableSchema,
        duplicatedTableName,
      })
    )

    const columns = duplicateTable.columns ?? []
    const identityColumns = columns.filter((column) => column.identity_generation !== null)
    identityColumns.forEach((column) => {
      sqlStatements.push(
        getDuplicateIdentitySequenceSQL({
          sourceTableName,
          sourceTableSchema,
          duplicatedTableName,
          columnName: column.name,
        })
      )
    })
  }

  await Sentry.startSpan(
    { name: 'duplicate_table.execute_sql', op: 'db.sql.transaction' },
    async (span) => {
      span.setAttribute('sql.statement_count', sqlStatements.length)
      await executeSql({
        projectRef,
        connectionString,
        sql: safeSql`BEGIN; ${joinSqlFragments(sqlStatements, ';\n')}; COMMIT;`,
      })
    }
  )

  await queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, sourceTableSchema) })

  const tables = await queryClient.fetchQuery({
    queryKey: tableKeys.list(projectRef, sourceTableSchema),
    queryFn: ({ signal }) =>
      getTables({ projectRef, connectionString, schema: sourceTableSchema }, signal),
  })

  const duplicatedTable = find(tables, { schema: sourceTableSchema, name: duplicatedTableName })!

  if (isRLSEnabled) {
    await updateTableMutation({
      projectRef,
      connectionString,
      id: duplicatedTable?.id!,
      name: duplicatedTable?.name!,
      schema: duplicatedTable?.schema!,
      payload: { rls_enabled: isRLSEnabled },
    })
  }

  return duplicatedTable
}

export const createTable = async ({
  projectRef,
  connectionString,
  toastId,
  payload,
  columns = [],
  foreignKeyRelations,
  isRLSEnabled,
  importContent,
  track,
  scoped,
}: {
  projectRef: string
  connectionString?: string | null
  toastId: string | number
  payload: {
    name: string
    schema: string
    comment?: string | null
  }
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  isRLSEnabled: boolean
  importContent?: ImportContent
  track: Track
  scoped?: boolean
}) => {
  const queryClient = getQueryClient()

  // Build all SQL statements for table creation, columns, and constraints
  // to execute in a single transaction for better performance and atomicity
  const sqlStatements: Array<SafeSqlFragment> = []

  // 1. Create table SQL
  const { sql: createTableSql } = pgMeta.tables.create({ ...payload, no_transaction: true })
  sqlStatements.push(createTableSql)

  // 2. Enable RLS if configured
  if (isRLSEnabled) {
    const enableRLSSQL = getEnableRLSSQL({
      schema: payload.schema,
      table: payload.name,
    })
    sqlStatements.push(enableRLSSQL)
  }

  // 3. Add columns SQL (without primary keys - those are added as constraints)
  for (const column of columns) {
    const columnPayload = generateCreateColumnPayload(
      { schema: payload.schema, name: payload.name } as RetrieveTableResult,
      { ...column, isPrimaryKey: false }
    )
    const { sql: columnSQL } = pgMeta.columns.create({
      schema: columnPayload.schema,
      table: columnPayload.table,
      name: columnPayload.name,
      type: columnPayload.type,
      default_value: columnPayload.defaultValue,
      default_value_format: columnPayload.defaultValueFormat,
      is_identity: columnPayload.isIdentity,
      is_nullable: columnPayload.isNullable,
      is_primary_key: columnPayload.isPrimaryKey,
      is_unique: columnPayload.isUnique,
      comment: columnPayload.comment,
      check: columnPayload.check,
      no_transaction: true,
    })
    sqlStatements.push(columnSQL)
  }

  // 4. Add primary key constraint (supports composite keys)
  const primaryKeyColumns = columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => column.name)
  if (primaryKeyColumns.length > 0) {
    const primaryKeySQL = getAddPrimaryKeySQL({
      schema: payload.schema,
      table: payload.name,
      columns: primaryKeyColumns,
    })
    sqlStatements.push(primaryKeySQL)
  }

  // 5. Add foreign key constraints
  if (foreignKeyRelations.length > 0) {
    const fkSql = getAddForeignKeySQL({
      table: { schema: payload.schema, name: payload.name },
      foreignKeys: foreignKeyRelations,
    })
    const fkSqlWithoutTrailingSemicolon = fkSql.replace(/;+$/, '') as SafeSqlFragment
    sqlStatements.push(fkSqlWithoutTrailingSemicolon)
  }

  // Execute all table creation SQL in a single transaction
  toast.loading(`Creating table ${payload.name}...`, { id: toastId })

  await Sentry.startSpan(
    { name: 'create_table.execute_sql', op: 'db.sql.transaction' },
    async (span) => {
      span.setAttribute('sql.statement_count', sqlStatements.length)
      await executeSql({
        projectRef,
        connectionString,
        sql: safeSql`BEGIN; ${joinSqlFragments(sqlStatements, ';\n')}; COMMIT;`,
        queryKey: ['table', 'create-with-columns'],
      })
    }
  )

  track('table_created', {
    method: 'table_editor',
    schema_name: payload.schema,
    table_name: payload.name,
  })

  if (isRLSEnabled) {
    track('table_rls_enabled', {
      method: 'table_editor',
      schema_name: payload.schema,
      table_name: payload.name,
    })
  }

  // Fetch the created table
  const table = await Sentry.startSpan(
    { name: 'create_table.fetch_table', op: 'db.table.fetch' },
    async () => {
      return await getTableQuery({
        projectRef,
        connectionString,
        name: payload.name,
        schema: payload.schema,
      })
    }
  )

  // If the user is importing data via a spreadsheet
  if (importContent !== undefined) {
    await Sentry.startSpan(
      { name: 'create_table.import_data', op: 'db.table.import' },
      async (span) => {
        const rowCount = importContent.file
          ? importContent.rowCount
          : (importContent.rows?.length ?? 0)
        span.setAttribute('import.row_count', rowCount)
        span.setAttribute('import.method', importContent.file ? 'csv' : 'paste')

        if (importContent.file && importContent.rowCount > 0) {
          // Via a CSV file
          const { error } = await insertRowsViaSpreadsheet({
            projectRef,
            connectionString,
            file: importContent.file,
            table,
            selectedHeaders: importContent.selectedHeaders,
            onProgressUpdate: (progress: number) => {
              toast.loading(
                <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                  <SparkBar
                    value={progress}
                    max={100}
                    type="horizontal"
                    barClass="bg-brand"
                    labelBottom={`Adding ${importContent.rowCount.toLocaleString()} rows to ${table.name}`}
                    labelBottomClass=""
                    labelTop={`${progress.toFixed(2)}%`}
                    labelTopClass="tabular-nums"
                  />
                </div>,
                { id: toastId }
              )
            },
            emptyStringAsNullHeaders: importContent.emptyStringAsNullHeaders,
          })

          if (error !== undefined) {
            span.setAttribute('import.error', 1)
            toast.error('Do check your spreadsheet if there are any discrepancies.')
            const message = isObjectContainingKeys(error, ['message'])
              ? String(error.message)
              : 'An unknown error occurred during data import.'
            toast.error(message)
            console.error('Error:', { error, message })
          }
        } else {
          // Via text copy and paste
          await insertTableRows({
            projectRef,
            connectionString,
            table,
            rows: importContent.rows,
            selectedHeaders: importContent.selectedHeaders,
            onProgressUpdate: (progress: number) => {
              toast.loading(
                <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                  <SparkBar
                    value={progress}
                    max={100}
                    type="horizontal"
                    barClass="bg-brand"
                    labelBottom={`Adding ${importContent.rows.length.toLocaleString()} rows to ${table.name}`}
                    labelTop={`${progress.toFixed(2)}%`}
                    labelTopClass="tabular-nums"
                  />
                </div>,
                { id: toastId }
              )
            },
            emptyStringAsNullHeaders: importContent.emptyStringAsNullHeaders,
          })
        }

        // For identity columns, manually raise the sequences (batched for performance)
        const identityColumns = columns.filter((column) => column.isIdentity)
        if (identityColumns.length > 0) {
          const updateSequenceSQL = joinSqlFragments(
            identityColumns.map((column) =>
              getUpdateIdentitySequenceSQL({
                schema: table.schema,
                table: table.name,
                column: column.name,
              })
            ),
            ';\n'
          )
          await executeSql({
            projectRef,
            connectionString,
            sql: updateSequenceSQL,
            queryKey: ['sequences', 'update-batch'],
          })
        }
      }
    )
  }

  await Sentry.startSpan(
    { name: 'create_table.prefetch_editor', op: 'db.table.prefetch' },
    async () => {
      await prefetchEditorTablePage({
        queryClient,
        projectRef,
        connectionString,
        id: table.id,
        scoped,
      })
    }
  )

  // Finally, return the created table
  return { table }
}

/** TODO: Refactor to do in a single transaction */
export const updateTable = async ({
  projectRef,
  connectionString,
  toastId,
  table,
  payload,
  columns,
  foreignKeyRelations,
  existingForeignKeyRelations,
  primaryKey,
  track,
  scoped,
}: {
  projectRef: string
  connectionString?: string | null
  toastId: string | number
  table: RetrieveTableResult
  payload: UpdateTableBody
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  existingForeignKeyRelations: ForeignKeyConstraint[]
  primaryKey?: Constraint
  track: Track
  scoped?: boolean
}) => {
  const queryClient = getQueryClient()
  const sqlStatements: Array<SafeSqlFragment> = []

  const primaryKeyColumns = columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => column.name)
  const existingPrimaryKeyColumns = table.primary_keys.map((pk: PGTablePrimaryKey) => pk.name)
  const isPrimaryKeyUpdated = !isEqual(primaryKeyColumns, existingPrimaryKeyColumns)

  if (isPrimaryKeyUpdated && primaryKey !== undefined) {
    sqlStatements.push(
      getDropConstraintSQL({
        schema: table.schema,
        table: table.name,
        name: primaryKey.name,
      })
    )
  }

  if (Object.keys(payload).length > 0) {
    const { sql } = pgMeta.tables.update({ id: table.id, name: table.name, schema: table.schema }, payload)
    sqlStatements.push(sql as SafeSqlFragment)
  }

  const updatedTable = {
    ...table,
    name: payload.name ?? table.name,
    schema: payload.schema ?? table.schema,
  } as RetrieveTableResult

  const originalColumns = table.columns ?? []
  const columnIds = columns.map((column) => column.id)

  const columnsToRemove = originalColumns.filter((column) => !columnIds.includes(column.id))
  for (const column of columnsToRemove) {
    const { sql } = pgMeta.columns.remove(column)
    sqlStatements.push(sql as SafeSqlFragment)
  }

  for (const column of columns) {
    if (!column.id.includes(table.id.toString())) {
      const columnPayload = generateCreateColumnPayload(updatedTable, { ...column, isPrimaryKey: false })
      const { sql: createColumnSql } = pgMeta.columns.create({
        schema: columnPayload.schema,
        table: columnPayload.table,
        name: columnPayload.name,
        type: columnPayload.type,
        default_value: columnPayload.defaultValue,
        default_value_format: columnPayload.defaultValueFormat,
        is_identity: columnPayload.isIdentity,
        identity_generation: columnPayload.identityGeneration,
        is_nullable: columnPayload.isNullable,
        is_unique: columnPayload.isUnique,
        comment: columnPayload.comment,
        check: columnPayload.check,
        no_transaction: true,
      })
      sqlStatements.push(createColumnSql as SafeSqlFragment)
    } else {
      const originalColumn = find(table.columns, { id: column.id })
      if (originalColumn) {
        const columnPayload = generateUpdateColumnPayload(originalColumn, updatedTable, column)
        if (!isEmpty(columnPayload)) {
          const { sql: updateColumnSql } = pgMeta.columns.update(
            {
              ...originalColumn,
              table: updatedTable.name,
              schema: updatedTable.schema,
            },
            {
              name: columnPayload.name,
              type: columnPayload.type,
              drop_default: columnPayload.dropDefault,
              default_value: columnPayload.defaultValue,
              default_value_format: columnPayload.defaultValueFormat,
              is_identity: columnPayload.isIdentity,
              identity_generation: columnPayload.identityGeneration,
              is_nullable: columnPayload.isNullable,
              is_unique: columnPayload.isUnique,
              comment: columnPayload.comment,
              check: columnPayload.check,
            }
          )
          sqlStatements.push(updateColumnSql as SafeSqlFragment)
        }
      }
    }
  }

  if (isPrimaryKeyUpdated && primaryKeyColumns.length > 0) {
    sqlStatements.push(
      getAddPrimaryKeySQL({
        schema: updatedTable.schema,
        table: updatedTable.name,
        columns: primaryKeyColumns,
      })
    )
  }

  const fkSqls = getUpdateForeignKeysSQL({
    table: updatedTable,
    foreignKeys: foreignKeyRelations,
    existingForeignKeyRelations,
  })
  sqlStatements.push(...fkSqls)

  toast.loading(`Updating table ${table.name}...`, { id: toastId })

  try {
    await Sentry.startSpan(
      { name: 'update_table.execute_sql', op: 'db.sql.transaction' },
      async (span) => {
        span.setAttribute('sql.statement_count', sqlStatements.length)
        await executeSql({
          projectRef,
          connectionString,
          sql: safeSql`BEGIN; ${joinSqlFragments(sqlStatements, ';\n')}; COMMIT;`,
        })
      }
    )

    if (Object.keys(payload).length > 0) {
      await queryClient.invalidateQueries({ queryKey: tableKeys.infiniteListPrefix(projectRef, table.schema) })
      if (payload.schema && payload.schema !== table.schema) {
        await queryClient.invalidateQueries({ queryKey: tableKeys.infiniteListPrefix(projectRef, payload.schema) })
      }
    }

    if (payload.rls_enabled === true) {
      track('table_rls_enabled', {
        method: 'table_editor',
        schema_name: table.schema,
        table_name: payload.name ?? table.name,
      })
    }

    await invalidateTableMetadata(queryClient, {
      projectRef,
      schema: table.schema,
      tableId: table.id,
      tableName: table.name,
      newSchema: updatedTable.schema,
      newTableName: updatedTable.name,
      includeRows: true,
      includeLint: true,
    })

    toast.success(`Successfully updated table "${updatedTable.name}"`, { id: toastId })
    return { 
      table: await prefetchTableEditor(queryClient, {
        projectRef,
        connectionString,
        id: table.id,
        scoped,
      }), 
      hasError: false 
    }
  } catch (error: any) {
    toast.error(`Failed to update table "${table.name}": ${error.message}`, { id: toastId })
    return { error, hasError: true }
  }
}

/**
 * Used in insertRowsViaSpreadsheet + insertTableRows
 */
export const formatRowsForInsert = ({
  rows,
  headers,
  columns = [],
  emptyStringAsNullHeaders = headers,
}: {
  rows: unknown[]
  headers: string[]
  columns?: RetrieveTableResult['columns']
  emptyStringAsNullHeaders?: string[]
}) => {
  return rows.map((row) => {
    const formattedRow: Record<string, unknown> = {}
    if (!isObject(row)) {
      return formattedRow
    }

    headers.forEach((header) => {
      const column = columns?.find((c) => c.name === header)

      const originalValue = row[header]

      if ((column?.format ?? '').includes('json')) {
        formattedRow[header] = tryParseJson(originalValue)
      } else if ((column?.data_type ?? '') === 'ARRAY') {
        if (
          typeof originalValue === 'string' &&
          originalValue.startsWith('{') &&
          originalValue.endsWith('}')
        ) {
          const formattedPostgresArraytoJsonArray = `[${originalValue.slice(1, originalValue.length - 1)}]`
          formattedRow[header] = tryParseJson(formattedPostgresArraytoJsonArray)
        } else {
          formattedRow[header] = tryParseJson(originalValue)
        }
      } else if (originalValue === '') {
        formattedRow[header] =
          column?.is_nullable && emptyStringAsNullHeaders.includes(header) ? null : ''
      } else {
        formattedRow[header] = originalValue
      }
    })
    return formattedRow
  })
}

export async function insertRowsViaSpreadsheet({
  projectRef,
  connectionString,
  file,
  table,
  selectedHeaders,
  emptyStringAsNullHeaders = selectedHeaders,
  onProgressUpdate,
}: {
  projectRef: string
  connectionString: string | undefined | null
  file: File
  table: RetrieveTableResult
  selectedHeaders: string[]
  emptyStringAsNullHeaders?: string[]
  onProgressUpdate: (progress: number) => void
}): Promise<{ error: unknown }> {
  let chunkNumber = 0
  let insertError: unknown = undefined
  const t1 = new Date()
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      // dynamicTyping has to be disabled so that "00001" doesn't get parsed as 1.
      dynamicTyping: false,
      skipEmptyLines: true,
      chunkSize: CHUNK_SIZE,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunk: async (results, parser) => {
        parser.pause()

        const formattedData = formatRowsForInsert({
          rows: results.data,
          headers: selectedHeaders,
          columns: table.columns,
          emptyStringAsNullHeaders,
        })

        const insertQuery = new Query().from(table.name, table.schema).insert(formattedData).toSql()
        try {
          await executeWithRetry(() =>
            executeSql({ projectRef, connectionString, sql: insertQuery })
          )
        } catch (error) {
          console.warn(error)
          insertError = error
          parser.abort()
        }

        chunkNumber += 1
        const progress = (chunkNumber * CHUNK_SIZE) / file.size
        const progressPercentage = progress > 1 ? 100 : progress * 100
        onProgressUpdate(progressPercentage)
        parser.resume()
      },
      complete: () => {
        const t2 = new Date()
        console.log(
          `Total time taken for importing spreadsheet: ${(t2.getTime() - t1.getTime()) / 1000} seconds`
        )
        if (insertError === undefined) {
          const sequenceColumns = (table.columns ?? []).filter(
            (column) =>
              column.is_identity ||
              (typeof column.default_value === 'string' &&
                column.default_value.includes('nextval('))
          )

          if (sequenceColumns.length === 0) {
            resolve({ error: insertError })
            return
          }

          const updateSequenceSQL = joinSqlFragments(
            sequenceColumns.map((column) =>
              getUpdateIdentitySequenceSQL({
                schema: table.schema,
                table: table.name,
                column: column.name,
              })
            ),
            ';\n'
          )

          executeSql({
            projectRef,
            connectionString,
            sql: updateSequenceSQL,
            queryKey: ['sequences', 'update-batch'],
          })
            .then(() => resolve({ error: insertError }))
            .catch((error) => resolve({ error }))
          return
        }

        resolve({ error: insertError })
      },
    })
  })
}

export async function insertTableRows({
  projectRef,
  connectionString,
  table,
  rows,
  selectedHeaders,
  emptyStringAsNullHeaders = selectedHeaders,
  onProgressUpdate,
}: {
  projectRef: string
  connectionString: string | undefined | null
  table: RetrieveTableResult
  rows: unknown[]
  selectedHeaders: string[]
  emptyStringAsNullHeaders?: string[]
  onProgressUpdate: (progress: number) => void
}): Promise<{ error: unknown }> {
  let insertError: unknown = undefined
  let insertProgress = 0

  const formattedRows = formatRowsForInsert({
    rows,
    headers: selectedHeaders,
    columns: table.columns,
    emptyStringAsNullHeaders,
  })

  const batches = chunk(formattedRows, BATCH_SIZE)
  const tasks = batches.map((batch) => {
    return () => {
      return Promise.race([
        new Promise(async (resolve, reject) => {
          const insertQuery = new Query().from(table.name, table.schema).insert(batch).toSql()
          try {
            await executeSql({ projectRef, connectionString, sql: insertQuery })
          } catch (error) {
            insertError = error
            reject(error)
          }

          insertProgress = insertProgress + batch.length / rows.length
          resolve({})
        }),
        timeout(30_000),
      ])
    }
  })

  const batchedPromises = chunk(tasks, 10)
  for (const batchedPromise of batchedPromises) {
    const res = await Promise.allSettled(batchedPromise.map((batch) => batch()))
    const failedBatch = res.find((result) => result.status === 'rejected')
    if (failedBatch?.status === 'rejected') {
      if (insertError === undefined) insertError = failedBatch.reason
      break
    }
    onProgressUpdate(insertProgress * 100)
  }

  if (insertError !== undefined) {
    return { error: insertError }
  }

  const sequenceColumns = (table.columns ?? []).filter(
    (column) =>
      column.is_identity ||
      (typeof column.default_value === 'string' && column.default_value.includes('nextval('))
  )

  if (sequenceColumns.length === 0) {
    return { error: insertError }
  }

  const updateSequenceSQL = joinSqlFragments(
    sequenceColumns.map((column) =>
      getUpdateIdentitySequenceSQL({
        schema: table.schema,
        table: table.name,
        column: column.name,
      })
    ),
    ';\n'
  )

  try {
    await executeSql({
      projectRef,
      connectionString,
      sql: updateSequenceSQL,
      queryKey: ['sequences', 'update-batch'],
    })
    return { error: insertError }
  } catch (error) {
    return { error }
  }
}

export const getUpdateForeignKeysSQL = ({
  table,
  foreignKeys,
  existingForeignKeyRelations,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
  existingForeignKeyRelations: ForeignKeyConstraint[]
}) => {
  const sqlStatements: Array<SafeSqlFragment> = []

  const relationsToAdd = foreignKeys.filter((x) => typeof x.id === 'string')
  if (relationsToAdd.length > 0) {
    sqlStatements.push(getAddForeignKeySQL({ table, foreignKeys: relationsToAdd }).replace(/;+$/, '') as SafeSqlFragment)
  }

  const relationsToRemove = foreignKeys.filter((x) => x.toRemove)
  if (relationsToRemove.length > 0) {
    sqlStatements.push(getRemoveForeignKeySQL({ table, foreignKeys: relationsToRemove }).replace(/;+$/, '') as SafeSqlFragment)
  }

  const remainingRelations = foreignKeys.filter((x) => typeof x.id === 'number' && !x.toRemove)
  const relationsToUpdate = remainingRelations.filter((x) => {
    const existingRelation = existingForeignKeyRelations.find((y) => x.id === y.id)
    if (existingRelation !== undefined) {
      return checkIfRelationChanged(existingRelation as unknown as ForeignKeyConstraint, x)
    } else return false
  })
  
  if (relationsToUpdate.length > 0) {
    sqlStatements.push(getRemoveForeignKeySQL({ table, foreignKeys: relationsToUpdate }).replace(/;+$/, '') as SafeSqlFragment)
    sqlStatements.push(getAddForeignKeySQL({ table, foreignKeys: relationsToUpdate }).replace(/;+$/, '') as SafeSqlFragment)
  }

  return sqlStatements
}
