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
  type ForeignKey,
} from '@supabase/pg-meta'
import { joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
import { find, isEmpty, isEqual } from 'lodash'
import { toast } from 'sonner'

import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor/ColumnEditor.utils'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import {
  insertRowsViaSpreadsheet,
  insertTableRows,
} from './SpreadsheetImport/SpreadsheetImportInsert.utils'
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
import { tableKeys } from '@/data/tables/keys'
import { invalidateTableMetadata } from '@/data/tables/table-metadata-invalidation'
import { getTable, getTableQuery, RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import {
  UpdateTableBody,
  updateTable as updateTableMutation,
} from '@/data/tables/table-update-mutation'
import { getTables } from '@/data/tables/tables-query'
import type { SafePostgresColumn } from '@/lib/postgres-types'
import type { useTrack } from '@/lib/telemetry/track'
import type { DeepReadonly } from '@/lib/type-helpers'
import type { SidePanel } from '@/state/table-editor'

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
    // Once pg-meta supports composite keys, we can remove this logic
    const { isPrimaryKey, ...formattedPayload } = payload
    await createDatabaseColumn({
      projectRef: projectRef,
      connectionString: connectionString,
      payload: formattedPayload,
    })

    // Firing createColumn in createTable will bypass this block
    if (isPrimaryKey) {
      toast.loading('Assigning primary key to column...', { id: toastId })
      // Same logic in createTable: Remove any primary key constraints first (we'll add it back later)
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        await dropConstraint(
          projectRef,
          connectionString,
          payload.schema,
          payload.table,
          primaryKey.name
        )
      }

      const primaryKeyColumns = existingPrimaryKeys.concat([formattedPayload.name])
      await addPrimaryKey(
        projectRef,
        connectionString,
        payload.schema,
        payload.table,
        primaryKeyColumns
      )
    }

    // Then add the foreign key constraints here
    if (foreignKeyRelations.length > 0) {
      await addForeignKey({
        projectRef,
        connectionString,
        table: { schema: payload.schema, name: payload.table },
        foreignKeys: foreignKeyRelations,
      })
    }

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
    await updateDatabaseColumn({
      projectRef,
      connectionString,
      originalColumn,
      payload: formattedPayload,
    })

    if (!skipPKCreation && isPrimaryKey !== undefined) {
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      // Primary key is getting updated for the column
      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        await dropConstraint(
          projectRef,
          connectionString,
          originalColumn.schema,
          originalColumn.table,
          primaryKey.name
        )
      }

      const columnName = formattedPayload.name ?? originalColumn.name
      const primaryKeyColumns = isPrimaryKey
        ? existingPrimaryKeys.concat([columnName])
        : existingPrimaryKeys.filter((x) => x !== columnName)

      if (primaryKeyColumns.length) {
        await addPrimaryKey(
          projectRef,
          connectionString,
          originalColumn.schema,
          originalColumn.table,
          primaryKeyColumns
        )
      }
    }

    // Then update foreign keys
    if (foreignKeyRelations.length > 0) {
      await updateForeignKeys({
        projectRef,
        connectionString,
        table: { schema: originalColumn.schema, name: originalColumn.table },
        foreignKeys: foreignKeyRelations,
        existingForeignKeyRelations,
      })
    }

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

  // The following query will copy the structure of the table along with indexes, constraints and
  // triggers. However, foreign key constraints are not duplicated over - has to be done separately
  await executeSql({
    projectRef,
    connectionString,
    sql: getDuplicateTableSQL({
      sourceTableName,
      sourceTableSchema,
      duplicatedTableName,
      comment: payload.comment,
    }),
  })
  await queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, sourceTableSchema) })

  // Duplicate foreign key constraints over
  if (foreignKeyRelations.length > 0) {
    await addForeignKey({
      projectRef,
      connectionString,
      table: { ...duplicateTable, name: payload.name },
      foreignKeys: foreignKeyRelations,
    })
  }

  // Duplicate rows if needed
  if (isDuplicateRows) {
    await executeSql({
      projectRef,
      connectionString,
      sql: getDuplicateRowsSQL({
        sourceTableName,
        sourceTableSchema,
        duplicatedTableName,
      }),
    })

    // Insert into does not copy over auto increment sequences, so we manually do it next if any
    const columns = duplicateTable.columns ?? []
    const identityColumns = columns.filter((column) => column.identity_generation !== null)
    identityColumns.map(async (column) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: getDuplicateIdentitySequenceSQL({
          sourceTableName,
          sourceTableSchema,
          duplicatedTableName,
          columnName: column.name,
        }),
      })
    })
  }

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

  const importResult =
    importContent === undefined
      ? undefined
      : await Sentry.startSpan(
          { name: 'create_table.import_data', op: 'db.table.import' },
          async (span) => {
            span.setAttribute('import.row_count', importContent.rowCount)
            span.setAttribute('import.method', importContent.file ? 'csv' : 'paste')
            const options = {
              projectRef,
              connectionString,
              table,
              selectedHeaders: importContent.selectedHeaders,
              emptyStringAsNullHeaders: importContent.emptyStringAsNullHeaders,
              onProgressUpdate: (progress: number) => {
                toast.loading(
                  <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                    <SparkBar
                      value={progress}
                      max={100}
                      type="horizontal"
                      barClass="bg-primary-bright"
                      labelBottom={`Processing ${importContent.rowCount.toLocaleString()} rows for ${table.name}`}
                      labelTop={`${progress.toFixed(2)}%`}
                      labelTopClass="tabular-nums"
                    />
                  </div>,
                  { id: toastId }
                )
              },
            }
            const result = importContent.file
              ? await insertRowsViaSpreadsheet({ ...options, file: importContent.file })
              : await insertTableRows({ ...options, rows: importContent.rows })
            if (result.status === 'error') span.setAttribute('import.error', 1)
            return result
          }
        )

  await Sentry.startSpan(
    { name: 'create_table.prefetch_editor', op: 'db.table.prefetch' },
    async () => {
      await prefetchEditorTablePage({
        queryClient,
        projectRef,
        connectionString,
        id: table.id,
      })
    }
  )

  // Finally, return the created table
  return { table, importResult }
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
}) => {
  const queryClient = getQueryClient()

  // Prepare a check to see if primary keys to the tables were updated or not
  const primaryKeyColumns = columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => column.name)
  const existingPrimaryKeyColumns = table.primary_keys.map((pk: PGTablePrimaryKey) => pk.name)
  const isPrimaryKeyUpdated = !isEqual(primaryKeyColumns, existingPrimaryKeyColumns)

  if (isPrimaryKeyUpdated) {
    // Remove any primary key constraints first (we'll add it back later)
    // If we do it later, and if the user deleted a PK column, we'd need to do
    // an additional check when removing PK if the column in the PK was removed
    // So doing this one step earlier, lets us skip that additional check.
    if (primaryKey !== undefined) {
      await dropConstraint(projectRef, connectionString, table.schema, table.name, primaryKey.name)
    }
  }

  if (Object.keys(payload).length > 0) {
    await updateTableMutation({
      projectRef,
      connectionString,
      id: table.id,
      name: table.name,
      schema: table.schema,
      payload,
    })
    await queryClient.invalidateQueries({
      queryKey: tableKeys.infiniteListPrefix(projectRef, table.schema),
    })
    if (payload.schema && payload.schema !== table.schema) {
      await queryClient.invalidateQueries({
        queryKey: tableKeys.infiniteListPrefix(projectRef, payload.schema),
      })
    }
  }

  if (payload.rls_enabled === true) {
    track('table_rls_enabled', {
      method: 'table_editor',
      schema_name: table.schema,
      table_name: payload.name ?? table.name,
    })
  }

  const updatedTable = await queryClient.fetchQuery({
    queryKey: tableKeys.retrieve(
      projectRef,
      payload.name ?? table.name,
      payload.schema ?? table.schema
    ),
    queryFn: ({ signal }) =>
      getTable(
        {
          projectRef,
          connectionString,
          name: payload.name ?? table.name,
          schema: payload.schema ?? table.schema,
        },
        signal
      ),
  })

  const originalColumns = updatedTable.columns ?? []
  const columnIds = columns.map((column) => column.id)

  // Delete any removed columns
  const columnsToRemove = originalColumns.filter((column) => !columnIds.includes(column.id))
  for (const column of columnsToRemove) {
    toast.loading(`Removing column ${column.name} from ${updatedTable.name}`, { id: toastId })
    await deleteDatabaseColumn({
      projectRef,
      connectionString,
      column,
    })
  }

  // Add any new columns / Update any existing columns
  let hasError = false
  for (const column of columns) {
    if (!column.id.includes(table.id.toString())) {
      toast.loading(`Adding column ${column.name} to ${updatedTable.name}`, { id: toastId })
      // Ensure that columns do not created as primary key first, cause the primary key will
      // be added later on further down in the code
      const columnPayload = generateCreateColumnPayload(updatedTable, {
        ...column,
        isPrimaryKey: false,
      })
      const { error } = await createColumn({
        projectRef: projectRef,
        connectionString: connectionString,
        payload: columnPayload,
        selectedTable: updatedTable,
        skipSuccessMessage: true,
        toastId,
      })
      if (!!error) hasError = true
    } else {
      const originalColumn = find(table.columns, { id: column.id })
      if (originalColumn) {
        const columnPayload = generateUpdateColumnPayload(originalColumn, updatedTable, column)
        if (!isEmpty(columnPayload)) {
          toast.loading(`Updating column ${column.name} from ${updatedTable.name}`, { id: toastId })

          const res = await updateColumn({
            projectRef: projectRef,
            connectionString: connectionString,
            // Use the updated table name and schema since the table might have been renamed
            originalColumn: {
              ...originalColumn,
              table: updatedTable.name,
              schema: updatedTable.schema,
            },
            payload: columnPayload,
            selectedTable: updatedTable,
            skipPKCreation: true,
            skipSuccessMessage: true,
          })
          if (res?.error) {
            hasError = true
            toast.error(`Failed to update column "${column.name}": ${res.error.message}`)
          }
        }
      }
    }
  }

  // Then add back the primary keys again
  if (isPrimaryKeyUpdated && primaryKeyColumns.length > 0) {
    await addPrimaryKey(
      projectRef,
      connectionString,
      updatedTable.schema,
      updatedTable.name,
      primaryKeyColumns
    )
  }

  // Foreign keys will get updated here accordingly
  await updateForeignKeys({
    projectRef,
    connectionString,
    table: updatedTable,
    foreignKeys: foreignKeyRelations,
    existingForeignKeyRelations,
  })

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

  return {
    table: await prefetchTableEditor(queryClient, {
      projectRef,
      connectionString,
      id: table.id,
    }),
    hasError,
  }
}

const updateForeignKeys = async ({
  projectRef,
  connectionString,
  table,
  foreignKeys,
  existingForeignKeyRelations,
}: {
  projectRef: string
  connectionString?: string | null
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
  existingForeignKeyRelations: ForeignKeyConstraint[]
}) => {
  // Foreign keys will get updated here accordingly
  const relationsToAdd = foreignKeys.filter((x) => typeof x.id === 'string')
  if (relationsToAdd.length > 0) {
    await addForeignKey({
      projectRef,
      connectionString,
      table,
      foreignKeys: relationsToAdd,
    })
  }

  const relationsToRemove = foreignKeys.filter((x) => x.toRemove)
  if (relationsToRemove.length > 0) {
    await removeForeignKey({
      projectRef,
      connectionString,
      table,
      foreignKeys: relationsToRemove,
    })
  }

  const remainingRelations = foreignKeys.filter((x) => typeof x.id === 'number' && !x.toRemove)
  const relationsToUpdate = remainingRelations.filter((x) => {
    const existingRelation = existingForeignKeyRelations.find((y) => x.id === y.id)
    if (existingRelation !== undefined) {
      return checkIfRelationChanged(existingRelation as unknown as ForeignKeyConstraint, x)
    } else return false
  })
  if (relationsToUpdate.length > 0) {
    await updateForeignKey({
      projectRef,
      connectionString,
      table,
      foreignKeys: relationsToUpdate,
    })
  }
}
