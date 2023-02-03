import Papa from 'papaparse'
import { makeObservable, observable } from 'mobx'
import { find, isUndefined, isEqual, isEmpty, chunk } from 'lodash'
import { Query } from 'components/grid/query/Query'

import type {
  PostgresColumn,
  PostgresTable,
  PostgresRelationship,
  PostgresPrimaryKey,
  PostgresSchema,
} from '@supabase/postgres-meta'

import { IS_PLATFORM, API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { timeout } from 'lib/helpers'
import { ResponseError, SchemaView } from 'types'

import { IRootStore } from '../RootStore'
import ColumnStore from './ColumnStore'
import SchemaStore from './SchemaStore'
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
import RolesStore, { IRolesStore } from './RolesStore'
import PoliciesStore from './PoliciesStore'
import TriggersStore from './TriggersStore'
import PublicationStore from './PublicationStore'
import FunctionsStore from './FunctionsStore'
import HooksStore from './HooksStore'
import ExtensionsStore from './ExtensionsStore'
import TypesStore from './TypesStore'
import ForeignTableStore from './ForeignTableStore'
import ViewStore from './ViewStore'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

export interface IMetaStore {
  excludedSchemas: string[]

  openApi: IOpenApiStore
  tables: ITableStore
  columns: IPostgresMetaInterface<PostgresColumn>
  schemas: IPostgresMetaInterface<PostgresSchema>
  views: IPostgresMetaInterface<SchemaView>
  foreignTables: IPostgresMetaInterface<Partial<PostgresTable>>

  hooks: IPostgresMetaInterface<any>
  roles: IRolesStore
  policies: IPostgresMetaInterface<any>
  triggers: IPostgresMetaInterface<any>
  functions: IPostgresMetaInterface<any>
  extensions: IPostgresMetaInterface<any>
  publications: IPostgresMetaInterface<any>
  types: IPostgresMetaInterface<any>

  projectRef?: string

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
  createColumn: (
    payload: CreateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>,
    securityConfiguration?: { isEncrypted: boolean; keyId?: string; keyName?: string }
  ) => any
  updateColumn: (
    id: string,
    payload: UpdateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>,
    skipPKCreation?: boolean
  ) => any
  duplicateTable: (
    payload: any,
    metadata: {
      duplicateTable: PostgresTable
      isRLSEnabled: boolean
      isRealtimeEnabled: boolean
      isDuplicateRows: boolean
    }
  ) => void
  createTable: (
    toastId: string,
    payload: any,
    columns: ColumnField[],
    isRLSEnabled: boolean,
    isRealtimeEnabled: boolean,
    importContent?: ImportContent
  ) => any
  updateTable: (
    toastId: string,
    table: PostgresTable,
    payload: any,
    columns: ColumnField[],
    isRealtimeEnabled: boolean
  ) => any

  setProjectDetails: (details: { ref: string; connectionString?: string }) => void
}
export default class MetaStore implements IMetaStore {
  rootStore: IRootStore
  openApi: OpenApiStore
  tables: TableStore
  columns: ColumnStore
  schemas: SchemaStore
  views: ViewStore
  foreignTables: ForeignTableStore

  hooks: HooksStore
  roles: RolesStore
  policies: PoliciesStore
  triggers: TriggersStore
  functions: FunctionsStore
  extensions: ExtensionsStore
  publications: PublicationStore
  types: TypesStore

  projectRef?: string
  connectionString?: string
  baseUrl: string
  headers: { [prop: string]: any }

  // [Joshen] I'm going to treat this as a list of system schemas
  excludedSchemas = [
    'auth',
    'extensions',
    'information_schema',
    'net',
    'pgsodium',
    'pgsodium_masks',
    'pgbouncer',
    'realtime',
    'storage',
    'supabase_functions',
    'vault',
    'graphql',
    'graphql_public',
  ]

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

    this.openApi = new OpenApiStore(
      this.rootStore,
      `${API_URL}/props/project/${this.projectRef}/api`
    )
    this.tables = new TableStore(this.rootStore, `${this.baseUrl}/tables`, this.headers)
    this.columns = new ColumnStore(this.rootStore, `${this.baseUrl}/columns`, this.headers)
    this.schemas = new SchemaStore(this.rootStore, `${this.baseUrl}/schemas`, this.headers)
    this.views = new ViewStore(this.rootStore, `${this.baseUrl}/views`, this.headers)
    this.foreignTables = new ForeignTableStore(
      this.rootStore,
      `${this.baseUrl}/foreign-tables`,
      this.headers
    )

    this.roles = new RolesStore(this.rootStore, `${this.baseUrl}/roles`, this.headers)
    this.policies = new PoliciesStore(this.rootStore, `${this.baseUrl}/policies`, this.headers)
    this.hooks = new HooksStore(this.rootStore, `${this.baseUrl}/triggers`, this.headers)
    this.triggers = new TriggersStore(this.rootStore, `${this.baseUrl}/triggers`, this.headers)
    this.functions = new FunctionsStore(this.rootStore, `${this.baseUrl}/functions`, this.headers)
    this.extensions = new ExtensionsStore(
      this.rootStore,
      `${this.baseUrl}/extensions`,
      this.headers,
      {
        identifier: 'name',
      }
    )
    this.publications = new PublicationStore(
      this.rootStore,
      `${this.baseUrl}/publications`,
      this.headers
    )
    this.types = new TypesStore(this.rootStore, `${this.baseUrl}/types`, this.headers)

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

  async updateTableRealtime(table: PostgresTable, enable: boolean) {
    let publicationUpdateError
    const publications = this.publications.list()
    const publicTables = this.tables.list((table: PostgresTable) => table.schema === 'public')

    let realtimePublication = publications.find((pub) => pub.name === 'supabase_realtime')
    if (realtimePublication === undefined) {
      const { data: publication, error: publicationCreateError } = await this.publications.create({
        name: 'supabase_realtime',
        publish_insert: true,
        publish_update: true,
        publish_delete: true,
        tables: [],
      })
      if (publicationCreateError) throw publicationCreateError
      realtimePublication = publication
    }

    const { id, tables: publicationTables } = realtimePublication
    if (publicationTables === null) {
      // UI doesn't have support for toggling realtime for ALL tables
      // Switch it to individual tables via an array of strings
      // Refer to PublicationStore for more information about this
      const realtimeTables = enable
        ? publicTables.map((t: any) => `${t.schema}.${t.name}`)
        : publicTables
            .filter((t: any) => t.id !== table.id)
            .map((t: any) => `${t.schema}.${t.name}`)
      const { error } = await this.publications.update(id, { tables: realtimeTables })
      publicationUpdateError = error
    } else {
      const isAlreadyEnabled = publicationTables.some((x: any) => x.id == table.id)

      const realtimeTables =
        isAlreadyEnabled && !enable
          ? // Toggle realtime off
            publicationTables
              .filter((t: any) => t.id !== table.id)
              .map((t: any) => `${t.schema}.${t.name}`)
          : !isAlreadyEnabled && enable
          ? // Toggle realtime on
            [`${table.schema}.${table.name}`].concat(
              publicationTables.map((t: any) => `${t.schema}.${t.name}`)
            )
          : null

      if (realtimeTables === null) return

      const payload = { id, tables: realtimeTables }
      const { error } = await this.publications.update(id, payload)
      publicationUpdateError = error
    }

    if (publicationUpdateError) throw publicationUpdateError
  }

  async createColumn(
    payload: CreateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>,
    securityConfiguration?: { isEncrypted: boolean; keyId?: string; keyName?: string }
  ) {
    const toastId = this.rootStore.ui.setNotification({
      category: 'loading',
      message: `Creating column "${payload.name}"...`,
    })
    try {
      // Once pg-meta supports composite keys, we can remove this logic
      const { isPrimaryKey, ...formattedPayload } = payload

      const column: any = await this.columns.create(formattedPayload)
      if (column.error) throw column.error

      // Firing createColumn in createTable will bypass this block
      if (isPrimaryKey) {
        this.rootStore.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: 'Assigning primary key to column...',
        })
        // Same logic in createTable: Remove any primary key constraints first (we'll add it back later)
        // @ts-ignore
        const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

        if (existingPrimaryKeys.length > 0) {
          const removePK = await this.removePrimaryKey(column.schema, column.table)
          if (removePK.error) throw removePK.error
        }

        const primaryKeyColumns = existingPrimaryKeys.concat([column.name])
        const addPK = await this.addPrimaryKey(column.schema, column.table, primaryKeyColumns)
        if (addPK.error) throw addPK.error
      }

      if (!isUndefined(foreignKey)) {
        this.rootStore.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: 'Adding foreign key to column...',
        })
        const relation: any = await this.addForeignKey(foreignKey)
        if (relation.error) throw relation.error
      }

      const { isEncrypted, keyId, keyName } = securityConfiguration || {}
      if (isEncrypted) {
        this.rootStore.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: 'Encrypting column...',
        })
        let encryptionKey = keyId
        if (keyId === 'create-new') {
          const addKeyRes = await this.rootStore.vault.addKey(keyName)
          if (addKeyRes.error) throw addKeyRes.error
          else encryptionKey = addKeyRes[0].id
        }
        if (encryptionKey !== undefined) {
          const encryptColumnRes = await this.rootStore.vault.encryptColumn(column, encryptionKey)
          if (encryptColumnRes.error) throw encryptColumnRes.error
        }
      }
      this.rootStore.ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Successfully created column "${column.name}"`,
      })
    } catch (error: any) {
      this.rootStore.ui.setNotification({
        id: toastId,
        category: 'error',
        message: `An error occurred while creating the column "${payload.name}"`,
      })
      const query = `alter table "${selectedTable.name}" drop column if exists "${payload.name}";`
      await this.rootStore.meta.query(query)
      return { error }
    }
  }

  async updateColumn(
    id: string,
    payload: UpdateColumnPayload,
    selectedTable: PostgresTable,
    foreignKey?: Partial<PostgresRelationship>,
    skipPKCreation?: boolean
  ) {
    try {
      const { isPrimaryKey, ...formattedPayload } = payload
      const column: any = await this.columns.update(id, formattedPayload)
      if (column.error) throw column.error

      const originalColumn = find(selectedTable.columns, { id })
      const existingForeignKey = find(selectedTable.relationships, {
        source_column_name: originalColumn!.name,
      })

      if (!skipPKCreation && isPrimaryKey !== undefined) {
        const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

        // Primary key is getting updated for the column
        if (existingPrimaryKeys.length > 0) {
          const removePK = await this.removePrimaryKey(column.schema, column.table)
          if (removePK.error) throw removePK.error
        }
        const primaryKeyColumns = isPrimaryKey
          ? existingPrimaryKeys.concat([column.name])
          : existingPrimaryKeys.filter((x) => x !== column.name)
        const addPK = await this.addPrimaryKey(column.schema, column.table, primaryKeyColumns)
        if (addPK.error) throw addPK.error
      }

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
    metadata: {
      duplicateTable: PostgresTable
      isRLSEnabled: boolean
      isRealtimeEnabled: boolean
      isDuplicateRows: boolean
    }
  ) {
    const { duplicateTable, isRLSEnabled, isRealtimeEnabled, isDuplicateRows } = metadata
    const sourceTableName = duplicateTable.name
    const duplicatedTableName = payload.name

    // The following query will copy the structure of the table along with indexes, constraints and
    // triggers. However, foreign key constraints are not duplicated over - has to be done separately
    const table = await this.rootStore.meta.query(
      `CREATE TABLE "${duplicatedTableName}" (LIKE "${sourceTableName}" INCLUDING ALL);`
    )
    if (table.error) throw table.error

    // Duplicate foreign key constraints over
    const relationships = duplicateTable.relationships
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
    if (isDuplicateRows) {
      const rows = await this.rootStore.meta.query(
        `INSERT INTO "${duplicatedTableName}" SELECT * FROM ${sourceTableName};`
      )
      if (rows.error) throw rows.error

      // Insert into does not copy over auto increment sequences, so we manually do it next if any
      const columns = duplicateTable.columns
      // @ts-ignore
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

    if (isRLSEnabled) {
      const updateTable: any = await this.tables.update(duplicatedTable!.id, {
        rls_enabled: isRLSEnabled,
      })
      if (updateTable.error) throw updateTable.error
    }

    if (isRealtimeEnabled && duplicatedTable) await this.updateTableRealtime(duplicatedTable, true)

    return duplicatedTable
  }

  async createTable(
    toastId: string,
    payload: any,
    columns: ColumnField[] = [],
    isRLSEnabled: boolean,
    isRealtimeEnabled: boolean,
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

      // Toggle Realtime if configured to be
      if (isRealtimeEnabled) await this.updateTableRealtime(table, true)

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

  async updateTable(
    toastId: string,
    table: PostgresTable,
    payload: any,
    columns: ColumnField[],
    isRealtimeEnabled: boolean
  ) {
    // Prepare a check to see if primary keys to the tables were updated or not
    const primaryKeyColumns = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => `"${column.name}"`)
    // @ts-ignore
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
    // @ts-ignore
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
        await this.createColumn(columnPayload, updatedTable, column.foreignKey)
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
            const res: any = await this.updateColumn(
              column.id,
              columnPayload,
              updatedTable,
              column.foreignKey,
              skipPKCreation
            )
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
      const primaryKeys = await this.addPrimaryKey(
        updatedTable.schema,
        updatedTable.name,
        primaryKeyColumns
      )
      if (primaryKeys.error) throw primaryKeys.error
    }

    // Update table's realtime configuration
    await this.updateTableRealtime(table, isRealtimeEnabled)

    return { table: await this.tables.loadById(table.id), hasError }
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

  setProjectDetails({ ref, connectionString }: { ref: string; connectionString?: string }) {
    this.projectRef = ref
    this.baseUrl = `${API_URL}/pg-meta/${ref}`
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      this.headers['x-connection-encrypted'] = connectionString
    }

    this.openApi.setUrl(`${API_URL}/props/project/${this.projectRef}/api`)
    this.openApi.setHeaders(this.headers)

    this.tables.setUrl(`${this.baseUrl}/tables`)
    this.tables.setHeaders(this.headers)

    this.columns.setUrl(`${this.baseUrl}/columns`)
    this.columns.setHeaders(this.headers)

    this.schemas.setUrl(`${this.baseUrl}/schemas`)
    this.schemas.setHeaders(this.headers)

    this.views.setUrl(`${this.baseUrl}/views`)
    this.views.setHeaders(this.headers)

    this.foreignTables.setUrl(`${this.baseUrl}/foreign-tables`)
    this.foreignTables.setHeaders(this.headers)

    this.roles.setUrl(`${this.baseUrl}/roles`)
    this.roles.setHeaders(this.headers)

    this.policies.setUrl(`${this.baseUrl}/policies`)
    this.policies.setHeaders(this.headers)

    this.hooks.setUrl(`${this.baseUrl}/triggers`)
    this.hooks.setHeaders(this.headers)

    this.triggers.setUrl(`${this.baseUrl}/triggers`)
    this.triggers.setHeaders(this.headers)

    this.functions.setUrl(`${this.baseUrl}/functions`)
    this.functions.setHeaders(this.headers)

    this.extensions.setUrl(`${this.baseUrl}/extensions`)
    this.extensions.setHeaders(this.headers)

    this.publications.setUrl(`${this.baseUrl}/publications`)
    this.publications.setHeaders(this.headers)

    this.types.setUrl(`${this.baseUrl}/types`)
    this.types.setHeaders(this.headers)
  }
}
