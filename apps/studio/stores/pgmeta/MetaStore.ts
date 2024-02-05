import { Query } from 'components/grid/query/Query'
import { chunk, find, isEmpty, isEqual } from 'lodash'
import { makeObservable } from 'mobx'
import Papa from 'papaparse'

import type {
  PostgresPrimaryKey,
  PostgresRelationship,
  PostgresTable,
} from '@supabase/postgres-meta'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { timeout, tryParseJson } from 'lib/helpers'
import { ResponseError } from 'types'

import { IRootStore } from '../RootStore'
import TableStore, { ITableStore } from './TableStore'

import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'
import { ColumnField } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.types'
import {
  addForeignKey,
  addPrimaryKey,
  createColumn,
  removePrimaryKey,
  updateColumn,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.utils'
import { ImportContent } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.types'
import { createDatabaseColumn } from 'data/database-columns/database-column-create-mutation'
import { deleteDatabaseColumn } from 'data/database-columns/database-column-delete-mutation'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { getCachedProjectDetail } from 'data/projects/project-detail-query'
import { getQueryClient } from 'data/query-client'
import { tableKeys } from 'data/tables/keys'
import { getTable } from 'data/tables/table-query'
import { getTables } from 'data/tables/tables-query'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

export interface IMetaStore {
  tables: ITableStore

  projectRef?: string
  connectionString?: string

  query: (value: string) => Promise<any | { error: ResponseError }>
  validateQuery: (value: string) => Promise<any | { error: ResponseError }>
  formatQuery: (value: string) => Promise<any | { error: ResponseError }>

  duplicateTable: (
    payload: any,
    metadata: {
      duplicateTable: PostgresTable
      isRLSEnabled: boolean
      isDuplicateRows: boolean
    }
  ) => void
  createTable: (
    toastId: string,
    payload: any,
    columns: ColumnField[],
    isRLSEnabled: boolean,
    importContent?: ImportContent
  ) => any
  updateTable: (toastId: string, table: PostgresTable, payload: any, columns: ColumnField[]) => any
  insertRowsViaSpreadsheet: (
    file: any,
    table: PostgresTable,
    selectedHeaders: string[],
    onProgressUpdate: (progress: number) => void
  ) => void
  insertTableRows: (
    table: PostgresTable,
    rows: any,
    selectedHeaders: string[],
    onProgressUpdate: (progress: number) => void
  ) => any
  setProjectDetails: (details: { ref: string; connectionString?: string }) => void
}
export default class MetaStore implements IMetaStore {
  rootStore: IRootStore
  tables: TableStore

  projectRef: string
  connectionString?: string
  baseUrl: string
  headers: { [prop: string]: any }

  constructor(rootStore: IRootStore, options: { projectRef: string; connectionString?: string }) {
    const { projectRef, connectionString } = options
    this.rootStore = rootStore
    this.projectRef = projectRef
    this.baseUrl = `${API_URL}/pg-meta/${projectRef}`

    this.headers = {}
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      this.headers['x-connection-encrypted'] = connectionString
    }

    this.tables = new TableStore(this.rootStore, `${this.baseUrl}/tables`, this.headers)

    makeObservable(this, {})
  }

  /**
   * Sends a database query
   */
  async query(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  async validateQuery(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query/validate`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  async formatQuery(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query/format`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  async duplicateTable(
    payload: any,
    metadata: {
      duplicateTable: PostgresTable
      isRLSEnabled: boolean
      isDuplicateRows: boolean
    }
  ) {
    const { duplicateTable, isRLSEnabled, isDuplicateRows } = metadata
    const { name: sourceTableName, schema: sourceTableSchema } = duplicateTable
    const duplicatedTableName = payload.name

    // The following query will copy the structure of the table along with indexes, constraints and
    // triggers. However, foreign key constraints are not duplicated over - has to be done separately
    const table = await this.rootStore.meta.query(
      `CREATE TABLE "${sourceTableSchema}"."${duplicatedTableName}" (LIKE "${sourceTableSchema}"."${sourceTableName}" INCLUDING ALL);`
    )
    if (table.error) throw table.error

    // Duplicate foreign key constraints over
    const relationships = duplicateTable.relationships
    if (relationships.length > 0) {
      relationships.map(async (relationship: PostgresRelationship) => {
        await addForeignKey(this.projectRef, this.connectionString, {
          ...relationship,
          source_table_name: duplicatedTableName,
          deletion_action: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
          update_action: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
        })
      })
    }

    // Duplicate rows if needed
    if (isDuplicateRows) {
      const rows = await this.rootStore.meta.query(
        `INSERT INTO "${sourceTableSchema}"."${duplicatedTableName}" SELECT * FROM "${sourceTableSchema}"."${sourceTableName}";`
      )
      if (rows.error) throw rows.error

      // Insert into does not copy over auto increment sequences, so we manually do it next if any
      const columns = duplicateTable.columns ?? []
      const identityColumns = columns.filter((column) => column.identity_generation !== null)
      identityColumns.map(async (column) => {
        const identity = await this.rootStore.meta.query(
          `SELECT setval('"${sourceTableSchema}"."${duplicatedTableName}_${column.name}_seq"', (SELECT MAX("${column.name}") FROM "${sourceTableSchema}"."${sourceTableName}"));`
        )
        if (identity.error) throw identity.error
      })
    }

    const queryClient = getQueryClient()
    const project = await getCachedProjectDetail(queryClient, this.rootStore.ui.selectedProjectRef)
    const projectRef = project?.ref
    const connectionString = project?.connectionString
    const tables = await queryClient.fetchQuery({
      queryKey: tableKeys.list(projectRef, sourceTableSchema),
      queryFn: ({ signal }) =>
        getTables({ projectRef, connectionString, schema: sourceTableSchema }, signal),
    })

    const duplicatedTable = find(tables, { schema: sourceTableSchema, name: duplicatedTableName })

    if (isRLSEnabled) {
      const updateTable: any = await this.tables.update(duplicatedTable!.id, {
        rls_enabled: isRLSEnabled,
      })
      if (updateTable.error) throw updateTable.error
    }

    return duplicatedTable
  }

  async createTable(
    toastId: string,
    payload: any,
    columns: ColumnField[] = [],
    isRLSEnabled: boolean,
    importContent?: ImportContent
  ) {
    // Create the table first
    const table = await this.tables.create(payload)
    if ('error' in table) throw table.error

    // If we face any errors during this process after the actual table creation
    // We'll delete the table as a way to clean up and not leave behind bits that
    // got through successfully. This is so that the user can continue editing in
    // the table side panel editor conveniently
    try {
      // Toggle RLS if configured to be
      if (isRLSEnabled) {
        const updatedTable: any = await this.tables.update(table.id, {
          rls_enabled: isRLSEnabled,
        })
        if (updatedTable.error) throw updatedTable.error
      }

      // Then insert the columns - we don't do Promise.all as we want to keep the integrity
      // of the column order during creation. Note that we add primary key constraints separately
      // via the query endpoint to support composite primary keys as pg-meta does not support that OOB
      this.rootStore.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Adding ${columns.length} columns to ${table.name}...`,
      })

      for (const column of columns) {
        // We create all columns without primary keys first
        const columnPayload = generateCreateColumnPayload(table.id, {
          ...column,
          isPrimaryKey: false,
        })
        await createDatabaseColumn({
          projectRef: this.projectRef,
          connectionString: this.connectionString,
          payload: columnPayload,
        })
      }

      // Then add the primary key constraints here to support composite keys
      const primaryKeyColumns = columns
        .filter((column: ColumnField) => column.isPrimaryKey)
        .map((column: ColumnField) => column.name)
      if (primaryKeyColumns.length > 0) {
        await addPrimaryKey(
          this.projectRef,
          this.connectionString,
          table.schema,
          table.name,
          primaryKeyColumns
        )
      }

      // Then add the foreign key constraints here
      for (const column of columns) {
        if (column.foreignKey !== undefined) {
          await addForeignKey(this.projectRef, this.connectionString, column.foreignKey)
        }
      }

      // If the user is importing data via a spreadsheet
      if (importContent !== undefined) {
        if (importContent.file && importContent.rowCount > 0) {
          // Via a CSV file
          const { error }: any = await this.insertRowsViaSpreadsheet(
            importContent.file,
            table,
            importContent.selectedHeaders,
            (progress: number) => {
              this.rootStore.ui.setNotification({
                id: toastId,
                progress,
                category: 'loading',
                message: `Adding ${importContent.rowCount.toLocaleString()} rows to ${table.name}`,
              })
            }
          )

          // For identity columns, manually raise the sequences
          const identityColumns = columns.filter((column) => column.isIdentity)
          for (const column of identityColumns) {
            const identity = await this.rootStore.meta.query(
              `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`
            )
            if (identity.error) throw identity.error
          }

          if (error !== undefined) {
            this.rootStore.ui.setNotification({
              category: 'error',
              message: 'Do check your spreadsheet if there are any discrepancies.',
            })
            this.rootStore.ui.setNotification({
              category: 'error',
              message: `Table ${table.name} has been created but we ran into an error while inserting rows:
            ${error.message}`,
              error,
            })
          }
        } else {
          // Via text copy and paste
          await this.insertTableRows(
            table,
            importContent.rows,
            importContent.selectedHeaders,
            (progress: number) => {
              this.rootStore.ui.setNotification({
                id: toastId,
                progress,
                category: 'loading',
                message: `Adding ${importContent.rows.length.toLocaleString()} rows to ${
                  table.name
                }`,
              })
            }
          )

          // For identity columns, manually raise the sequences
          const identityColumns = columns.filter((column) => column.isIdentity)
          for (const column of identityColumns) {
            const identity = await this.rootStore.meta.query(
              `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`
            )
            if (identity.error) throw identity.error
          }
        }
      }

      // Finally, return the created table
      return table
    } catch (error: any) {
      this.tables.del(table.id)
      throw error
    }
  }

  async updateTable(toastId: string, table: PostgresTable, payload: any, columns: ColumnField[]) {
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
      if (table.primary_keys.length > 0) {
        await removePrimaryKey(this.projectRef, this.connectionString, table.schema, table.name)
      }
    }

    // Update the table
    const updatedTable: any = await this.tables.update(table.id, payload)
    if (updatedTable.error) throw updatedTable.error

    const originalColumns = table.columns ?? []
    const columnIds = columns.map((column) => column.id)

    // Delete any removed columns
    const columnsToRemove = originalColumns.filter((column) => !columnIds.includes(column.id))
    for (const column of columnsToRemove) {
      this.rootStore.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Removing column ${column.name} from ${updatedTable.name}`,
      })
      await deleteDatabaseColumn({
        projectRef: this.projectRef,
        connectionString: this.connectionString,
        id: column.id,
      })
    }

    // Add any new columns / Update any existing columns
    let hasError = false
    for (const column of columns) {
      if (!column.id.includes(table.id.toString())) {
        this.rootStore.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: `Adding column ${column.name} to ${updatedTable.name}`,
        })
        // Ensure that columns do not created as primary key first, cause the primary key will
        // be added later on further down in the code
        const columnPayload = generateCreateColumnPayload(updatedTable.id, {
          ...column,
          isPrimaryKey: false,
        })
        await createColumn({
          projectRef: this.projectRef,
          connectionString: this.connectionString,
          payload: columnPayload,
          selectedTable: updatedTable,
          foreignKey: column.foreignKey,
        })
      } else {
        const originalColumn = find(originalColumns, { id: column.id })
        if (originalColumn) {
          const columnPayload = generateUpdateColumnPayload(originalColumn, updatedTable, column)
          const originalForeignKey = find(table.relationships, {
            source_schema: originalColumn.schema,
            source_table_name: originalColumn.table,
            source_column_name: originalColumn.name,
          })
          const hasForeignKeyUpdated = !isEqual(originalForeignKey, column.foreignKey)
          if (!isEmpty(columnPayload) || hasForeignKeyUpdated) {
            this.rootStore.ui.setNotification({
              id: toastId,
              category: 'loading',
              message: `Updating column ${column.name} from ${updatedTable.name}`,
            })
            const skipPKCreation = true
            const skipSuccessMessage = true
            const res = await updateColumn({
              projectRef: this.projectRef,
              connectionString: this.connectionString,
              id: column.id,
              payload: columnPayload,
              selectedTable: updatedTable,
              foreignKey: column.foreignKey,
              skipPKCreation,
              skipSuccessMessage,
            })
            if (res?.error) {
              hasError = true
              this.rootStore.ui.setNotification({
                category: 'error',
                message: `Failed to update column "${column.name}": ${res.error.message}`,
              })
            }
          }
        }
      }
    }

    // Then add back the primary keys again
    if (isPrimaryKeyUpdated && primaryKeyColumns.length > 0) {
      await addPrimaryKey(
        this.projectRef,
        this.connectionString,
        updatedTable.schema,
        updatedTable.name,
        primaryKeyColumns
      )
    }

    const queryClient = getQueryClient()
    const project = await getCachedProjectDetail(queryClient, this.rootStore.ui.selectedProjectRef)
    const projectRef = project?.ref
    const connectionString = project?.connectionString

    queryClient.invalidateQueries(tableKeys.table(projectRef, table.id))

    return {
      table: await getTable({
        projectRef,
        connectionString,
        id: table.id,
      }),
      hasError,
    }
  }

  async insertRowsViaSpreadsheet(
    file: any,
    table: PostgresTable,
    selectedHeaders: string[],
    onProgressUpdate: (progress: number) => void
  ) {
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

          const formattedData = results.data.map((row: any) => {
            const formattedRow: any = {}
            selectedHeaders.forEach((header) => {
              const column = table.columns?.find((c) => c.name === header)
              if (
                (column?.data_type ?? '') === 'ARRAY' ||
                (column?.format ?? '').includes('json')
              ) {
                formattedRow[header] = tryParseJson(row[header])
              } else if (row[header] === '') {
                // if the cell is empty string, convert it to NULL
                formattedRow[header] = null
              } else {
                formattedRow[header] = row[header]
              }
            })
            return formattedRow
          })

          const insertQuery = new Query()
            .from(table.name, table.schema)
            .insert(formattedData)
            .toSql()
          const res = await this.query(insertQuery)

          if (res.error) {
            console.warn(res.error)
            insertError = res.error
            parser.abort()
          } else {
            chunkNumber += 1
            const progress = (chunkNumber * CHUNK_SIZE) / file.size
            const progressPercentage = progress > 1 ? 100 : progress * 100
            onProgressUpdate(progressPercentage)
            parser.resume()
          }
        },
        complete: () => {
          const t2: any = new Date()
          console.log(`Total time taken for importing spreadsheet: ${(t2 - t1) / 1000} seconds`)
          resolve({ error: insertError })
        },
      })
    })
  }

  async insertTableRows(
    table: PostgresTable,
    rows: any,
    selectedHeaders: string[],
    onProgressUpdate: (progress: number) => void
  ) {
    let insertError = undefined
    let insertProgress = 0

    const formattedRows = rows.map((row: any) => {
      const formattedRow: any = {}
      selectedHeaders.forEach((header) => {
        const column = table.columns?.find((c) => c.name === header)
        if ((column?.data_type ?? '') === 'ARRAY' || (column?.format ?? '').includes('json')) {
          formattedRow[header] = tryParseJson(row[header])
        } else {
          formattedRow[header] = row[header]
        }
      })
      return formattedRow
    })

    const batches = chunk(formattedRows, BATCH_SIZE)
    const promises = batches.map((batch: any) => {
      return () => {
        return Promise.race([
          new Promise(async (resolve, reject) => {
            const insertQuery = new Query().from(table.name, table.schema).insert(batch).toSql()
            const res = await this.query(insertQuery)

            if (res.error) {
              insertError = res.error
              reject(res.error)
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

  setProjectDetails({ ref, connectionString }: { ref: string; connectionString?: string }) {
    this.projectRef = ref
    this.baseUrl = `${API_URL}/pg-meta/${ref}`
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      this.headers['x-connection-encrypted'] = connectionString
    }

    this.tables.setUrl(`${this.baseUrl}/tables`)
    this.tables.setHeaders(this.headers)
  }
}
