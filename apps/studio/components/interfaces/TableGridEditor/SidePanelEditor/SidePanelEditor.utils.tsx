import type { PostgresPrimaryKey, PostgresTable } from '@supabase/postgres-meta'
import { chunk, find, isEmpty, isEqual } from 'lodash'
import Papa from 'papaparse'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import SparkBar from 'components/ui/SparkBar'
import { generateSqlPolicy } from 'data/ai/sql-policy-mutation'
import { createDatabaseColumn } from 'data/database-columns/database-column-create-mutation'
import { deleteDatabaseColumn } from 'data/database-columns/database-column-delete-mutation'
import { updateDatabaseColumn } from 'data/database-columns/database-column-update-mutation'
import type { Constraint } from 'data/database/constraints-query'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { lintKeys } from 'data/lint/keys'
import { prefetchEditorTablePage } from 'data/prefetchers/project.$ref.editor.$id'
import { getQueryClient } from 'data/query-client'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { tableRowKeys } from 'data/table-rows/keys'
import { executeWithRetry } from 'data/table-rows/table-rows-query'
import { tableKeys } from 'data/tables/keys'
import { createTable as createTableMutation } from 'data/tables/table-create-mutation'
import { deleteTable as deleteTableMutation } from 'data/tables/table-delete-mutation'
import {
  getTable,
  RetrievedTableColumn,
  RetrieveTableResult,
} from 'data/tables/table-retrieve-query'
import {
  UpdateTableBody,
  updateTable as updateTableMutation,
} from 'data/tables/table-update-mutation'
import { getTables } from 'data/tables/tables-query'
import { sendEvent } from 'data/telemetry/send-event-mutation'
import { timeout, tryParseJson } from 'lib/helpers'
import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor/ColumnEditor.utils'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import { checkIfRelationChanged } from './TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'
import type { ImportContent } from './TableEditor/TableEditor.types'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

/**
 * The functions below are basically just queries but may be supported directly
 * from the pg-meta library in the future
 */
export const addPrimaryKey = async (
  projectRef: string,
  connectionString: string | undefined | null,
  schema: string,
  table: string,
  columns: string[]
) => {
  const primaryKeyColumns = columns.join('","')
  const query = `ALTER TABLE "${schema}"."${table}" ADD PRIMARY KEY ("${primaryKeyColumns}")`
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['primary-keys'],
  })
}

export const dropConstraint = async (
  projectRef: string,
  connectionString: string | undefined | null,
  schema: string,
  table: string,
  name: string
) => {
  const query = `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${name}"`
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['drop-constraint'],
  })
}

export const getAddForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const getOnDeleteSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON DELETE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON DELETE RESTRICT'
        : action === FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT
          ? 'ON DELETE SET DEFAULT'
          : action === FOREIGN_KEY_CASCADE_ACTION.SET_NULL
            ? 'ON DELETE SET NULL'
            : ''
  const getOnUpdateSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON UPDATE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON UPDATE RESTRICT'
        : ''
  return (
    foreignKeys
      .map((relation) => {
        const { deletionAction, updateAction } = relation
        const onDeleteSql = getOnDeleteSql(deletionAction)
        const onUpdateSql = getOnUpdateSql(updateAction)
        return `
      ALTER TABLE "${table.schema}"."${table.name}"
      ADD FOREIGN KEY (${relation.columns.map((column) => `"${column.source}"`).join(',')})
      REFERENCES "${relation.schema}"."${relation.table}" (${relation.columns.map((column) => `"${column.target}"`).join(',')})
      ${onUpdateSql}
      ${onDeleteSql}
    `
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join(';') + ';'
  )
}

export const addForeignKey = async ({
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

export const getRemoveForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  return (
    foreignKeys
      .map((relation) =>
        `
ALTER TABLE IF EXISTS "${table.schema}"."${table.name}"
DROP CONSTRAINT IF EXISTS "${relation.name}"
`
          .replace(/\s+/g, ' ')
          .trim()
      )
      .join(';') + ';'
  )
}

export const removeForeignKey = async ({
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

export const updateForeignKey = async ({
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
  const query = `
  ${getRemoveForeignKeySQL({ table, foreignKeys })}
  ${getAddForeignKeySQL({ table, foreignKeys })}
  `
    .replace(/\s+/g, ' ')
    .trim()
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
  } catch (error: any) {
    toast.error(`An error occurred while creating the column "${payload.name}"`, { id: toastId })
    return { error }
  }
}

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
  originalColumn: RetrievedTableColumn
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
    sql: [
      `CREATE TABLE "${sourceTableSchema}"."${duplicatedTableName}" (LIKE "${sourceTableSchema}"."${sourceTableName}" INCLUDING ALL);`,
      payload.comment != undefined
        ? `comment on table "${sourceTableSchema}"."${duplicatedTableName}" is '${payload.comment}';`
        : '',
    ].join('\n'),
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
      sql: `INSERT INTO "${sourceTableSchema}"."${duplicatedTableName}" SELECT * FROM "${sourceTableSchema}"."${sourceTableName}";`,
    })

    // Insert into does not copy over auto increment sequences, so we manually do it next if any
    const columns = duplicateTable.columns ?? []
    const identityColumns = columns.filter((column) => column.identity_generation !== null)
    identityColumns.map(async (column) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: `SELECT setval('"${sourceTableSchema}"."${duplicatedTableName}_${column.name}_seq"', (SELECT MAX("${column.name}") FROM "${sourceTableSchema}"."${sourceTableName}"));`,
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
  organizationSlug,
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
  organizationSlug?: string
}) => {
  const queryClient = getQueryClient()

  // Create the table first. Error may be thrown.
  await createTableMutation({
    projectRef: projectRef,
    connectionString: connectionString,
    payload: payload,
  })

  // Track table creation event
  try {
    await sendEvent({
      event: {
        action: 'table_created',
        properties: {
          method: 'table_editor',
          schema_name: payload.schema,
          table_name: payload.name,
        },
        groups: {
          project: projectRef,
          ...(organizationSlug && { organization: organizationSlug }),
        },
      },
    })
  } catch (error) {
    console.error('Failed to track table creation event:', error)
  }

  const table = await queryClient.fetchQuery({
    queryKey: tableKeys.retrieve(projectRef, payload.name, payload.schema),
    queryFn: ({ signal }) =>
      getTable(
        { projectRef, connectionString, name: payload.name, schema: payload.schema },
        signal
      ),
  })

  // If we face any errors during this process after the actual table creation
  // We'll delete the table as a way to clean up and not leave behind bits that
  // got through successfully. This is so that the user can continue editing in
  // the table side panel editor conveniently
  try {
    // Toggle RLS if configured to be
    if (isRLSEnabled) {
      await updateTableMutation({
        projectRef,
        connectionString,
        id: table.id,
        name: table.name,
        schema: table.schema,
        payload: { rls_enabled: isRLSEnabled },
      })

      // Track RLS enablement event
      try {
        await sendEvent({
          event: {
            action: 'table_rls_enabled',
            properties: {
              method: 'table_editor',
              schema_name: table.schema,
              table_name: table.name,
            },
            groups: {
              project: projectRef,
              ...(organizationSlug && { organization: organizationSlug }),
            },
          },
        })
      } catch (error) {
        console.error('Failed to track RLS enablement event:', error)
      }
    }

    // Then insert the columns - we don't do Promise.all as we want to keep the integrity
    // of the column order during creation. Note that we add primary key constraints separately
    // via the query endpoint to support composite primary keys as pg-meta does not support that OOB
    toast.loading(`Adding ${columns.length} columns to ${table.name}...`, { id: toastId })

    for (const column of columns) {
      // We create all columns without primary keys first
      const columnPayload = generateCreateColumnPayload(table, {
        ...column,
        isPrimaryKey: false,
      })
      await createDatabaseColumn({
        projectRef,
        connectionString,
        payload: columnPayload,
      })
    }

    // Then add the primary key constraints here to support composite keys
    const primaryKeyColumns = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => column.name)
    if (primaryKeyColumns.length > 0) {
      await addPrimaryKey(projectRef, connectionString, table.schema, table.name, primaryKeyColumns)
    }

    // Then add the foreign key constraints here
    if (foreignKeyRelations.length > 0) {
      await addForeignKey({
        projectRef,
        connectionString,
        table: { schema: table.schema, name: table.name },
        foreignKeys: foreignKeyRelations,
      })
    }

    // If the user is importing data via a spreadsheet
    if (importContent !== undefined) {
      if (importContent.file && importContent.rowCount > 0) {
        // Via a CSV file
        const { error }: any = await insertRowsViaSpreadsheet(
          projectRef,
          connectionString,
          importContent.file,
          table,
          importContent.selectedHeaders,
          (progress: number) => {
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
          }
        )

        // For identity columns, manually raise the sequences
        const identityColumns = columns.filter((column) => column.isIdentity)
        for (const column of identityColumns) {
          await executeSql({
            projectRef,
            connectionString,
            sql: `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`,
          })
        }

        if (error !== undefined) {
          toast.error('Do check your spreadsheet if there are any discrepancies.')

          const message = `Table ${table.name} has been created but we ran into an error while inserting rows: ${error.message}`
          toast.error(message)
          console.error('Error:', { error, message })
        }
      } else {
        // Via text copy and paste
        await insertTableRows(
          projectRef,
          connectionString,
          table,
          importContent.rows,
          importContent.selectedHeaders,
          (progress: number) => {
            toast.loading(
              <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                <SparkBar
                  value={progress}
                  max={100}
                  type="horizontal"
                  barClass="bg-brand"
                  labelBottom={`Adding ${importContent.rows.length.toLocaleString()} rows to ${table.name}`}
                  labelBottomClass=""
                  labelTop={`${progress.toFixed(2)}%`}
                  labelTopClass="tabular-nums"
                />
              </div>,
              { id: toastId }
            )
          }
        )

        // For identity columns, manually raise the sequences
        const identityColumns = columns.filter((column) => column.isIdentity)
        for (const column of identityColumns) {
          await executeSql({
            projectRef,
            connectionString,
            sql: `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`,
          })
        }
      }
    }

    await prefetchEditorTablePage({
      queryClient,
      projectRef,
      connectionString,
      id: table.id,
    })

    // Finally, return the created table
    return table
  } catch (error) {
    deleteTableMutation({
      projectRef,
      connectionString,
      id: table.id,
      name: table.name,
      schema: table.schema,
    })
    throw error
  }
}

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
  organizationSlug,
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
  organizationSlug?: string
}) => {
  const queryClient = getQueryClient()

  // Prepare a check to see if primary keys to the tables were updated or not
  const primaryKeyColumns = columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => column.name)
  const existingPrimaryKeyColumns = table.primary_keys.map((pk: PostgresPrimaryKey) => pk.name)
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
  }

  // Track RLS enablement if it's being turned on
  if (payload.rls_enabled === true) {
    try {
      await sendEvent({
        event: {
          action: 'table_rls_enabled',
          properties: {
            method: 'table_editor',
            schema_name: table.schema,
            table_name: payload.name ?? table.name,
          },
          groups: {
            project: projectRef,
            ...(organizationSlug && { organization: organizationSlug }),
          },
        },
      })
    } catch (error) {
      console.error('Failed to track RLS enablement event:', error)
    }
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

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: tableEditorKeys.tableEditor(projectRef, table.id) }),
    queryClient.invalidateQueries({
      queryKey: databaseKeys.foreignKeyConstraints(projectRef, table.schema),
    }),
    queryClient.invalidateQueries({ queryKey: databaseKeys.tableDefinition(projectRef, table.id) }),
    queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
    queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, table.schema, true) }),
    queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) }),
  ])

  // We need to invalidate tableRowsAndCount after tableEditor
  // to ensure the query sent is correct
  await queryClient.invalidateQueries({
    queryKey: tableRowKeys.tableRowsAndCount(projectRef, table.id),
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

/**
 * Used in insertRowsViaSpreadsheet + insertTableRows
 */
export const formatRowsForInsert = ({
  rows,
  headers,
  columns = [],
}: {
  rows: any[]
  headers: string[]
  columns?: RetrieveTableResult['columns']
}) => {
  return rows.map((row: any) => {
    const formattedRow: any = {}
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
        formattedRow[header] = column?.is_nullable ? null : ''
      } else {
        formattedRow[header] = originalValue
      }
    })
    return formattedRow
  })
}

export const insertRowsViaSpreadsheet = async (
  projectRef: string,
  connectionString: string | undefined | null,
  file: any,
  table: RetrieveTableResult,
  selectedHeaders: string[],
  onProgressUpdate: (progress: number) => void
) => {
  let chunkNumber = 0
  let insertError: any = undefined
  const t1: any = new Date()
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      // dynamicTyping has to be disabled so that "00001" doesn't get parsed as 1.
      dynamicTyping: false,
      skipEmptyLines: true,
      chunkSize: CHUNK_SIZE,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunk: async (results: any, parser: any) => {
        parser.pause()

        const formattedData = formatRowsForInsert({
          rows: results.data,
          headers: selectedHeaders,
          columns: table.columns,
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
        const t2: any = new Date()
        console.log(`Total time taken for importing spreadsheet: ${(t2 - t1) / 1000} seconds`)
        resolve({ error: insertError })
      },
    })
  })
}

export const insertTableRows = async (
  projectRef: string,
  connectionString: string | undefined | null,
  table: RetrieveTableResult,
  rows: any,
  selectedHeaders: string[],
  onProgressUpdate: (progress: number) => void
) => {
  let insertError = undefined
  let insertProgress = 0

  const formattedRows = formatRowsForInsert({
    rows,
    headers: selectedHeaders,
    columns: table.columns,
  })

  const batches = chunk(formattedRows, BATCH_SIZE)
  const promises = batches.map((batch: any) => {
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
        timeout(30000),
      ])
    }
  })

  const batchedPromises = chunk(promises, 10)
  for (const batchedPromise of batchedPromises) {
    const res = await Promise.allSettled(batchedPromise.map((batch) => batch()))
    const hasFailedBatch = find(res, { status: 'rejected' })
    if (hasFailedBatch) break
    onProgressUpdate(insertProgress * 100)
  }
  return { error: insertError }
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

// --- Policy Generation ---

export type GeneratedPolicy = {
  name: string
  sql: string
  command?: string
}

type Relationship = {
  source_schema: string
  source_table_name: string
  source_column_name: string
  target_table_schema: string
  target_table_name: string
  target_column_name: string
}

/**
 * BFS to find shortest path from table to auth.users via foreign key relationships.
 * Returns null if no path exists within maxDepth.
 */
const findPathToAuthUsers = (
  startTable: { relationships: Relationship[] },
  allTables: PostgresTable[],
  maxDepth = 3
): Relationship[] | null => {
  const queue: { table: { relationships: Relationship[] }; path: Relationship[] }[] = [
    { table: startTable, path: [] },
  ]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { table, path } = queue.shift()!
    if (path.length >= maxDepth) continue

    for (const rel of table.relationships) {
      // Found path to auth.users
      if (
        rel.target_table_schema === 'auth' &&
        rel.target_table_name === 'users' &&
        rel.target_column_name === 'id'
      ) {
        return [...path, rel]
      }

      const targetId = `${rel.target_table_schema}.${rel.target_table_name}`
      if (visited.has(targetId)) continue

      const targetTable = allTables.find(
        (t) => t.schema === rel.target_table_schema && t.name === rel.target_table_name
      )
      if (targetTable && !path.some((p) => p.source_table_name === targetTable.name)) {
        queue.push({ table: targetTable, path: [...path, rel] })
        visited.add(targetId)
      }
    }
  }
  return null
}

/** Generates SQL expression for RLS policy based on FK path to auth.users */
const buildPolicyExpression = (path: Relationship[]): string => {
  if (path.length === 0) return ''

  // Direct FK to auth.users
  if (path.length === 1) {
    return `(select auth.uid()) = ${path[0].source_column_name}`
  }

  // Indirect path - build EXISTS with JOINs
  const [first, ...rest] = path
  const firstTarget = `${first.target_table_schema}.${first.target_table_name}`
  const source = `${first.source_schema}.${first.source_table_name}`
  const last = path[path.length - 1]

  const joins = rest
    .slice(0, -1)
    .map(
      (r) =>
        `join ${r.target_table_schema}.${r.target_table_name} on ${r.target_table_schema}.${r.target_table_name}.${r.target_column_name} = ${r.source_schema}.${r.source_table_name}.${r.source_column_name}`
    )
    .join('\n  ')

  return `exists (
  select 1 from ${firstTarget}
  ${joins}
  where ${firstTarget}.${first.target_column_name} = ${source}.${first.source_column_name}
  and ${last.source_schema}.${last.source_table_name}.${last.source_column_name} = (select auth.uid())
)`
}

/** Builds policy SQL for all CRUD operations */
const buildPoliciesForPath = (
  table: { name: string; schema: string },
  path: Relationship[]
): GeneratedPolicy[] => {
  const expression = buildPolicyExpression(path)
  const targetCol = path[0].source_column_name

  return (['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as const).map((command) => {
    const name = `Enable ${command.toLowerCase()} access for users based on ${targetCol}`
    const base = `CREATE POLICY "${name}" ON "${table.schema}"."${table.name}" AS PERMISSIVE FOR ${command} TO public`

    const sql =
      command === 'INSERT'
        ? `${base} WITH CHECK (${expression});`
        : command === 'UPDATE'
          ? `${base} USING (${expression}) WITH CHECK (${expression});`
          : `${base} USING (${expression});`

    return { name, sql, command }
  })
}

/**
 * Generates RLS policies for a table.
 * First tries programmatic generation based on FK relationships to auth.users.
 * Falls back to AI generation if no path exists.
 */
export const generateStartingPoliciesForTable = async ({
  table,
  foreignKeyRelations,
  allTables,
  columns,
  projectRef,
  connectionString,
  orgSlug,
}: {
  table: { name: string; schema: string }
  foreignKeyRelations: ForeignKey[]
  allTables: PostgresTable[]
  columns: { name: string }[]
  projectRef: string
  connectionString?: string | null
  orgSlug?: string
}): Promise<GeneratedPolicy[]> => {
  // Try programmatic generation first
  try {
    const relationships: Relationship[] = foreignKeyRelations.flatMap((ref) =>
      ref.columns.map((col) => ({
        source_schema: table.schema,
        source_table_name: table.name,
        source_column_name: col.source,
        target_table_schema: ref.schema,
        target_table_name: ref.table,
        target_column_name: col.target,
      }))
    )

    const path = findPathToAuthUsers({ relationships }, allTables)
    if (path?.length) {
      return buildPoliciesForPath(table, path)
    }
  } catch (error) {
    console.error('Programmatic policy generation failed:', error)
  }

  // Fall back to AI generation
  if (projectRef && connectionString) {
    try {
      const aiPolicies = await generateSqlPolicy({
        tableName: table.name,
        schema: table.schema,
        columns: columns.map((col) => col.name.trim()),
        projectRef,
        connectionString,
        orgSlug,
      })
      return aiPolicies.map((p) => ({ ...p, command: undefined }))
    } catch (error) {
      console.error('AI policy generation failed:', error)
    }
  }

  return []
}

/** Creates policies in the database. Returns names of successfully created policies. */
export const createGeneratedPolicies = async ({
  policies,
  projectRef,
  connectionString,
}: {
  policies: GeneratedPolicy[]
  projectRef: string
  connectionString?: string | null
}): Promise<string[]> => {
  const created: string[] = []

  for (const policy of policies) {
    try {
      await executeSql({ projectRef, connectionString, sql: policy.sql })
      created.push(policy.name)
    } catch (error) {
      console.error(`Failed to create policy "${policy.name}":`, error)
    }
  }

  return created
}
