import Papa from 'papaparse'
import { makeObservable, observable } from 'mobx'
import { find, isUndefined, isEqual, isEmpty, chunk, maxBy } from 'lodash'
import { Query } from '@supabase/grid'
import {
  PostgresColumn,
  PostgresTable,
  PostgresRelationship,
  PostgresPrimaryKey,
} from '@supabase/postgres-meta'

import { IS_PLATFORM, API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { timeout } from 'lib/helpers'
import { ResponseError } from 'types'

import { IRootStore } from '../RootStore'
import ColumnStore from './ColumnStore'
import SchemaStore, { ISchemaStore } from './SchemaStore'
import TableStore, { ITableStore } from './TableStore'
import OpenApiStore, { IOpenApiStore } from './OpenApiStore'
import { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

import {
  ColumnField,
  CreateColumnPayload,
  UpdateColumnPayload,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.types'
import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'
import { ImportContent } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.types'
import RolesStore from './RolesStore'
import PoliciesStore from './PoliciesStore'
import TriggersStore from './TriggersStore'
import PublicationStore, { IPublicationStore } from './PublicationStore'
import FunctionsStore from './FunctionsStore'
import HooksStore from './HooksStore'
import ExtensionsStore from './ExtensionsStore'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.25 // 0.25MB

export interface IMetaStore {
  excludedSchemas: string[]

  openApi: IOpenApiStore
  tables: ITableStore
  columns: IPostgresMetaInterface<PostgresColumn>
  schemas: ISchemaStore

  hooks: IPostgresMetaInterface<any>
  roles: IPostgresMetaInterface<any>
  policies: IPostgresMetaInterface<any>
  triggers: IPostgresMetaInterface<any>
  functions: IPostgresMetaInterface<any>
  extensions: IPostgresMetaInterface<any>
  publications: IPublicationStore

  query: (value: string) => Promise<any | { error: ResponseError }>
  validateQuery: (value: string) => Promise<any | { error: ResponseError }>
  formatQuery: (value: string) => Promise<any | { error: ResponseError }>

  /** The methods below are basically just queries but may be supported directly
   * from the pg-meta library in the future */
  addPrimaryKey: (
    schema: string,
    table: string,
    columns: string[]
  ) => Promise<any | { error: ResponseError }>
  removePrimaryKey: (schema: string, table: string) => Promise<any | { error: ResponseError }>
  addForeignKey: (
    relationship: Partial<PostgresRelationship>
  ) => Promise<any | { error: ResponseError }>
  removeForeignKey: (
    relationship: Partial<PostgresRelationship>
  ) => Promise<any | { error: ResponseError }>

  /** The methods below involve several contexts due to the UI flow of the
   *  dashboard and hence do not sit within their own stores */
  createColumn: (payload: CreateColumnPayload, foreignKey?: Partial<PostgresRelationship>) => any
  updateColumn: (
    id: string,
    payload: UpdateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>
  ) => any
  duplicateTable: (
    payload: any,
    metadata: { duplicateTable: PostgresTable; isRLSEnabled: boolean; isDuplicateRows: boolean }
  ) => void
  createTable: (
    toastId: string,
    payload: any,
    isRLSEnabled: boolean,
    columns: ColumnField[],
    importContent?: ImportContent
  ) => any
  updateTable: (toastId: string, table: PostgresTable, payload: any, columns: ColumnField[]) => any
}
export default class MetaStore implements IMetaStore {
  rootStore: IRootStore
  openApi: OpenApiStore
  tables: TableStore
  columns: ColumnStore
  schemas: SchemaStore

  hooks: HooksStore
  roles: RolesStore
  policies: PoliciesStore
  triggers: TriggersStore
  functions: FunctionsStore
  extensions: ExtensionsStore
  publications: PublicationStore

  connectionString?: string
  baseUrl: string
  queryBaseUrl: string
  excludedSchemas = [
    'auth',
    'extensions',
    'information_schema',
    'net',
    'pg_catalog',
    'pgbouncer',
    'realtime',
    'storage',
    'supabase_functions',
  ]

  constructor(rootStore: IRootStore, options: { projectRef: string; connectionString: string }) {
    const { projectRef, connectionString } = options
    this.rootStore = rootStore
    this.baseUrl = `/api/pg-meta/${projectRef}`
    this.queryBaseUrl = `${API_URL}/pg-meta/${projectRef}`

    const headers: any = {}
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      headers['x-connection-encrypted'] = connectionString
    }

    this.openApi = new OpenApiStore(rootStore, `${API_URL}/props/project/${projectRef}/api`)
    this.tables = new TableStore(rootStore, `${this.baseUrl}/tables`, headers)
    this.columns = new ColumnStore(rootStore, `${this.baseUrl}/columns`, headers)
    this.schemas = new SchemaStore(rootStore, `${this.baseUrl}/schemas`, headers)

    this.roles = new RolesStore(rootStore, `${this.baseUrl}/roles`, headers)
    this.policies = new PoliciesStore(rootStore, `${this.baseUrl}/policies`, headers)
    this.hooks = new HooksStore(rootStore, `${this.baseUrl}/triggers`, headers)
    this.triggers = new TriggersStore(rootStore, `${this.baseUrl}/triggers`, headers)
    this.functions = new FunctionsStore(rootStore, `${this.baseUrl}/functions`, headers)
    this.extensions = new ExtensionsStore(rootStore, `${this.baseUrl}/extensions`, headers, {
      identifier: 'name',
    })
    this.publications = new PublicationStore(rootStore, `${this.baseUrl}/publications`, headers)

    makeObservable(this, {
      excludedSchemas: observable,
    })
  }

  /**
   * Sends a database query
   */
  async query(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.queryBaseUrl}/query`
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

  async addPrimaryKey(schema: string, table: string, columns: string[]) {
    const primaryKeyColumns = columns.join(',')
    const query = `ALTER TABLE "${schema}"."${table}" ADD PRIMARY KEY (${primaryKeyColumns})`
    return await this.query(query)
  }

  async removePrimaryKey(schema: string, table: string) {
    const query = `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${table}_pkey"`
    return await this.query(query)
  }

  async addForeignKey(relationship: Partial<PostgresRelationship>) {
    const query = `
      ALTER TABLE "${relationship.source_schema}"."${relationship.source_table_name}"
      ADD CONSTRAINT "${relationship.source_table_name}_${relationship.source_column_name}_fkey"
      FOREIGN KEY ("${relationship.source_column_name}")
      REFERENCES "${relationship.target_table_schema}"."${relationship.target_table_name}" ("${relationship.target_column_name}");
    `
      .replace(/\s+/g, ' ')
      .trim()
    return await this.query(query)
  }

  async removeForeignKey(relationship: Partial<PostgresRelationship>) {
    const constraintName =
      relationship.constraint_name ||
      `${relationship.source_table_name}_${relationship.source_column_name}_fkey`
    const query = `
      ALTER TABLE "${relationship.source_schema}"."${relationship.source_table_name}"
      DROP CONSTRAINT IF EXISTS "${constraintName}"
    `
      .replace(/\s+/g, ' ')
      .trim()
    return await this.query(query)
  }

  async createColumn(payload: CreateColumnPayload, foreignKey?: Partial<PostgresRelationship>) {
    try {
      const column: any = await this.columns.create(payload)
      if (column.error) throw column.error

      if (!isUndefined(foreignKey)) {
        const relation: any = await this.addForeignKey(foreignKey)
        if (relation.error) throw relation.error
      }
    } catch (error: any) {
      return { error }
    }
  }

  async updateColumn(
    id: string,
    payload: UpdateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>
  ) {
    try {
      const column: any = await this.columns.update(id, payload)
      if (column.error) throw column.error

      const originalColumn = find(selectedTable.columns, { id })
      const existingForeignKey = find(selectedTable.relationships, {
        source_column_name: originalColumn!.name,
      })

      // For updating of foreign key relationship, we remove the original one by default
      // Then just add whatever was in foreignKey - simplicity over trying to derive whether to update or not
      if (!isUndefined(existingForeignKey)) {
        const relation: any = await this.removeForeignKey(existingForeignKey)
        if (relation.error) throw relation.error
      }

      if (!isUndefined(foreignKey)) {
        const relation: any = await this.addForeignKey(foreignKey)
        if (relation.error) throw relation.error
      }
    } catch (error: any) {
      return { error }
    }
  }

  async duplicateTable(
    payload: any,
    metadata: { duplicateTable: PostgresTable; isRLSEnabled: boolean; isDuplicateRows: boolean }
  ) {
    const sourceTableName = metadata.duplicateTable.name
    const duplicatedTableName = payload.name

    // The following query will copy the structure of the table along with indexes, constraints and
    // triggers. However, foreign key constraints are not duplicated over - has to be done separately
    const table = await this.rootStore.meta.query(
      `CREATE TABLE "${duplicatedTableName}" (LIKE "${sourceTableName}" INCLUDING ALL);`
    )
    if (table.error) throw table.error

    // Duplicate foreign key constraints over
    const relationships = metadata.duplicateTable.relationships
    if (relationships.length > 0) {
      // @ts-ignore, but might need to investigate, sounds bad:
      // Type instantiation is excessively deep and possibly infinite
      relationships.map(async (relationship: PostgresRelationship) => {
        const relation = await this.rootStore.meta.addForeignKey({
          ...relationship,
          source_table_name: duplicatedTableName,
        })
        if (relation.error) throw relation.error
      })
    }

    // Duplicate rows if needed
    if (metadata.isDuplicateRows) {
      const rows = await this.rootStore.meta.query(
        `INSERT INTO "${duplicatedTableName}" SELECT * FROM ${sourceTableName};`
      )
      if (rows.error) throw rows.error

      // Insert into does not copy over auto increment sequences, so we manually do it next if any
      const columns = metadata.duplicateTable.columns
      const identityColumns = columns.filter((column) => column.identity_generation !== null)
      identityColumns.map(async (column) => {
        const identity = await this.rootStore.meta.query(
          `SELECT setval('${duplicatedTableName}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${sourceTableName}"));`
        )
        if (identity.error) throw identity.error
      })
    }

    await this.tables.load()
    const tables = this.tables.list()
    const duplicatedTable = find(tables, { name: duplicatedTableName })

    if (metadata.isRLSEnabled) {
      const updateTable: any = await this.tables.update(duplicatedTable!.id, {
        rls_enabled: metadata.isRLSEnabled,
      })
      if (updateTable.error) throw updateTable.error
    }

    return duplicatedTable
  }

  async createTable(
    toastId: string,
    payload: any,
    isRLSEnabled: boolean,
    columns: ColumnField[] = [],
    importContent?: ImportContent
  ) {
    // Create the table first
    const table: any = await this.tables.create(payload)
    if (table.error) throw table.error

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
        const newColumn: any = await this.columns.create(columnPayload)
        if (newColumn.error) throw newColumn.error
      }

      // Then add the primary key constraints here to support composite keys
      const primaryKeyColumns = columns
        .filter((column: ColumnField) => column.isPrimaryKey)
        .map((column: ColumnField) => `"${column.name}"`)
      if (primaryKeyColumns.length > 0) {
        const primaryKeys = await this.addPrimaryKey(table.schema, table.name, primaryKeyColumns)
        if (primaryKeys.error) throw primaryKeys.error
      }

      // Then add the foreign key constraints here
      for (const column of columns) {
        if (!isUndefined(column.foreignKey)) {
          const relationship = await this.addForeignKey(column.foreignKey)
          if (relationship.error) throw relationship.error
        }
      }

      // If the user is importing data via a spreadsheet
      if (!isUndefined(importContent)) {
        if (importContent.file && importContent.rowCount > 0) {
          // Via a CSV file
          const { error }: any = await this.insertRowsViaSpreadsheet(
            importContent.file,
            table,
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

          if (!isUndefined(error)) {
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
          await this.insertTableRows(table, importContent.rows, (progress: number) => {
            this.rootStore.ui.setNotification({
              id: toastId,
              progress,
              category: 'loading',
              message: `Adding ${importContent.rows.length.toLocaleString()} rows to ${table.name}`,
            })
          })

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
      return await this.tables.loadById(table.id)
    } catch (error: any) {
      this.tables.del(table.id)
      throw error
    }
  }

  async updateTable(toastId: string, table: PostgresTable, payload: any, columns: ColumnField[]) {
    // Prepare a check to see if primary keys to the tables were updated or not
    const primaryKeyColumns = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => `"${column.name}"`)
    const existingPrimaryKeyColumns = table.primary_keys.map(
      (pk: PostgresPrimaryKey) => `"${pk.name}"`
    )
    const isPrimaryKeyUpdated = !isEqual(primaryKeyColumns, existingPrimaryKeyColumns)

    if (isPrimaryKeyUpdated) {
      // Remove any primary key constraints first (we'll add it back later)
      // If we do it later, and if the user deleted a PK column, we'd need to do
      // an additional check when removing PK if the column in the PK was removed
      // So doing this one step earlier, lets us skip that additional check.
      if (table.primary_keys.length > 0) {
        const removePK = await this.removePrimaryKey(table.schema, table.name)
        if (removePK.error) throw removePK.error
      }
    }

    // Update the table
    const updatedTable: any = await this.tables.update(table.id, payload)
    if (updatedTable.error) throw updatedTable.error

    const originalColumns = table.columns
    const columnIds = columns.map((column) => column.id)

    // Delete any removed columns
    const columnsToRemove = originalColumns.filter((column) => !columnIds.includes(column.id))
    for (const column of columnsToRemove) {
      this.rootStore.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Removing column ${column.name} from ${updatedTable.name}`,
      })
      const deletedColumn: any = await this.columns.del(column.id)
      if (deletedColumn.error) throw deletedColumn.error
    }

    // Add any new columns / Update any existing columns
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
        await this.createColumn(columnPayload, column.foreignKey)
      } else {
        const originalColumn = find(originalColumns, { id: column.id })
        if (originalColumn) {
          const columnPayload = generateUpdateColumnPayload(originalColumn, column)
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
            await this.updateColumn(column.id, columnPayload, updatedTable, column.foreignKey)
          }
        }
      }
    }

    // Then add back the primary keys again
    if (isPrimaryKeyUpdated && primaryKeyColumns.length > 0) {
      const primaryKeys = await this.addPrimaryKey(
        updatedTable.schema,
        updatedTable.name,
        primaryKeyColumns
      )
      if (primaryKeys.error) throw primaryKeys.error
    }

    return await this.tables.loadById(table.id)
  }

  async insertRowsViaSpreadsheet(
    file: any,
    table: PostgresTable,
    onProgressUpdate: (progress: number) => void
  ) {
    let chunkNumber = 0
    let insertError: any = undefined
    const t1: any = new Date()
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        chunkSize: CHUNK_SIZE,
        quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
        chunk: async (results: any, parser: any) => {
          parser.pause()

          const insertQuery = new Query()
            .from(table.name, table.schema)
            .insert(results.data)
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
    onProgressUpdate: (progress: number) => void
  ) {
    let insertError = undefined
    let insertProgress = 0
    const batches = chunk(rows, BATCH_SIZE)
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
      if (hasFailedBatch) {
        break
      }
      onProgressUpdate(insertProgress * 100)
    }
  }
}
