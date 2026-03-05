import pgMeta from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import type { PostgresPrimaryKey } from '@supabase/postgres-meta'
import type { SupaRow } from 'components/grid/types'
import { GeneratedPolicy } from 'components/interfaces/Auth/Policies/Policies.utils'
import SparkBar from 'components/ui/SparkBar'
import { createDatabaseColumn } from 'data/database-columns/database-column-create-mutation'
import { deleteDatabaseColumn } from 'data/database-columns/database-column-delete-mutation'
import { updateDatabaseColumn } from 'data/database-columns/database-column-update-mutation'
import { createDatabasePolicy } from 'data/database-policies/database-policy-create-mutation'
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
import {
  RetrieveTableResult,
  RetrievedTableColumn,
  getTable,
  getTableQuery,
} from 'data/tables/table-retrieve-query'
import {
  UpdateTableBody,
  updateTable as updateTableMutation,
} from 'data/tables/table-update-mutation'
import { getTables } from 'data/tables/tables-query'
import { sendEvent } from 'data/telemetry/send-event-mutation'
import { timeout, tryParseJson } from 'lib/helpers'
import { chunk, find, isEmpty, isEqual } from 'lodash'
import Papa from 'papaparse'
import { toast } from 'sonner'
import type { SidePanel } from 'state/table-editor'

import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor/ColumnEditor.utils'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import { checkIfRelationChanged } from './TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'
import type { ImportContent } from './TableEditor/TableEditor.types'
import type { DeepReadonly } from '@/lib/type-helpers'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

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

/**
 * The functions below are basically just queries but may be supported directly
 * from the pg-meta library in the future
 */
const getAddPrimaryKeySQL = ({
  schema,
  table,
  columns,
}: {
  schema: string
  table: string
  columns: string[]
}) => {
  const primaryKeyColumns = columns.map((col) => `"${col}"`).join(', ')
  return `ALTER TABLE "${schema}"."${table}" ADD PRIMARY KEY (${primaryKeyColumns})`
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
  const query = `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${name}"`
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['drop-constraint'],
  })
}

const getAddForeignKeySQL = ({
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

const getRemoveForeignKeySQL = ({
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

const getUpdateIdentitySequenceSQL = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  return `SELECT setval('"${schema}"."${table}_${column}_seq"', (SELECT COALESCE(MAX("${column}"), 1) FROM "${schema}"."${table}"))`
}

const getEnableRLSSQL = ({ schema, table }: { schema: string; table: string }) => {
  return `ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY`
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
  } catch (error: any) {
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
  generatedPolicies = [],
  onCreatePoliciesSuccess,
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
  generatedPolicies?: GeneratedPolicy[]
  onCreatePoliciesSuccess?: () => void
}) => {
  const queryClient = getQueryClient()

  // Build all SQL statements for table creation, columns, and constraints
  // to execute in a single transaction for better performance and atomicity
  const sqlStatements: string[] = []

  // 1. Create table SQL
  const { sql: createTableSql } = pgMeta.tables.create(payload)
  sqlStatements.push(createTableSql)

  // 2. Enable RLS if configured
  if (isRLSEnabled) {
    const enableRLSSQL = getEnableRLSSQL({ schema: payload.schema, table: payload.name })
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
    // Remove trailing semicolon since we join with semicolons
    sqlStatements.push(fkSql.replace(/;+$/, ''))
  }

  // Execute all table creation SQL in a single transaction
  toast.loading(`Creating table ${payload.name}...`, { id: toastId })

  await executeSql({
    projectRef,
    connectionString,
    sql: sqlStatements.join(';\n'),
    queryKey: ['table', 'create-with-columns'],
  })

  // 6. Create generated RLS policies if any
  // [Joshen] Possible area for optimization to create all policies in a single query call
  // Can be subsequently added to the table creation SQL as well for a single transaction

  const failedPolicies: GeneratedPolicy[] = []
  if (generatedPolicies.length > 0 && isRLSEnabled) {
    toast.loading(`Creating ${generatedPolicies.length} policies for table...`, { id: toastId })
    await Promise.all(
      generatedPolicies.map(async (policy) => {
        try {
          return await createDatabasePolicy({
            projectRef,
            connectionString,
            payload: {
              name: policy.name,
              table: policy.table,
              schema: policy.schema,
              definition: policy.definition,
              check: policy.check,
              action: policy.action,
              command: policy.command,
              roles: policy.roles,
            },
          })
        } catch (error: any) {
          console.error('Failed to generate policy', error.message)
          failedPolicies.push(policy)
        }
      })
    )
    onCreatePoliciesSuccess?.()
  }

  // Track table creation event (fire-and-forget to avoid blocking)
  sendEvent({
    event: {
      action: 'table_created',
      properties: {
        method: 'table_editor',
        schema_name: payload.schema,
        table_name: payload.name,
        has_generated_policies: generatedPolicies.length > 0 && isRLSEnabled,
      },
      groups: {
        project: projectRef,
        ...(organizationSlug && { organization: organizationSlug }),
      },
    },
  }).catch((error) => {
    console.error('Failed to track table creation event:', error)
  })

  // Track RLS enablement event if enabled (fire-and-forget)
  if (isRLSEnabled) {
    sendEvent({
      event: {
        action: 'table_rls_enabled',
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
    }).catch((error) => {
      console.error('Failed to track RLS enablement event:', error)
    })
  }

  // Fetch the created table
  const table = await getTableQuery({
    projectRef,
    connectionString,
    name: payload.name,
    schema: payload.schema,
  })

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
                labelTop={`${progress.toFixed(2)}%`}
                labelTopClass="tabular-nums"
              />
            </div>,
            { id: toastId }
          )
        }
      )
    }

    // For identity columns, manually raise the sequences (batched for performance)
    const identityColumns = columns.filter((column) => column.isIdentity)
    if (identityColumns.length > 0) {
      const updateSequenceSQL = identityColumns
        .map((column) =>
          getUpdateIdentitySequenceSQL({
            schema: table.schema,
            table: table.name,
            column: column.name,
          })
        )
        .join(';\n')
      await executeSql({
        projectRef,
        connectionString,
        sql: updateSequenceSQL,
        queryKey: ['sequences', 'update-batch'],
      })
    }
  }

  await prefetchEditorTablePage({
    queryClient,
    projectRef,
    connectionString,
    id: table.id,
  })

  // Finally, return the created table
  return { table, failedPolicies }
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
