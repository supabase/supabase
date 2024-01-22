import { PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'
import { find } from 'lodash'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createDatabaseColumn } from 'data/database-columns/database-column-create-mutation'
import { updateDatabaseColumn } from 'data/database-columns/database-column-update-mutation'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { getViews } from 'data/views/views-query'
import { useStore } from 'hooks'
import { IMetaStore } from 'stores/pgmeta/MetaStore'
import {
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from './SidePanelEditor.types'

export interface UseEncryptedColumnsArgs {
  schemaName?: string
  tableName?: string
}

const listEncryptedColumns = async (meta: IMetaStore, schema: string, table: string) => {
  if (!table) return []

  const views = await getViews({
    projectRef: meta.projectRef,
    connectionString: meta.connectionString,
    schema,
  })
  const decryptedView = views.find((view) => view.name === `decrypted_${table}`)
  if (!decryptedView) return []

  const encryptedColumns = await meta.query(
    `SELECT column_name as name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'decrypted_${table}' and column_name like 'decrypted_%'`
  )
  if (!encryptedColumns.error) {
    return encryptedColumns.map((column: any) => column.name.split('decrypted_')[1])
  } else {
    console.error('Error fetching encrypted columns', encryptedColumns.error)
    return []
  }
}

export function useEncryptedColumns({ schemaName, tableName }: UseEncryptedColumnsArgs) {
  const { meta } = useStore()
  const [encryptedColumns, setEncryptedColumns] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const getEncryptedColumns = async () => {
      if (schemaName !== undefined && tableName !== undefined) {
        const columns = await listEncryptedColumns(meta, schemaName, tableName)

        if (isMounted) {
          setEncryptedColumns(columns)
        }
      }
    }

    getEncryptedColumns()

    return () => {
      isMounted = false
    }
  }, [schemaName, tableName])

  return encryptedColumns
}

/**
 * The functions below are basically just queries but may be supported directly
 * from the pg-meta library in the future
 */
export const addPrimaryKey = async (
  projectRef: string,
  connectionString: string | undefined,
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

export const removePrimaryKey = async (
  projectRef: string,
  connectionString: string | undefined,
  schema: string,
  table: string
) => {
  const query = `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${table}_pkey"`
  return await executeSql({
    projectRef: projectRef,
    connectionString: connectionString,
    sql: query,
    queryKey: ['primary-keys'],
  })
}

// [Joshen TODO] Eventually need to extend this to composite foreign keys
export const addForeignKey = async (
  projectRef: string,
  connectionString: string | undefined,
  relationship: ExtendedPostgresRelationship
) => {
  const { deletion_action, update_action } = relationship
  const deletionAction =
    deletion_action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON DELETE CASCADE'
      : deletion_action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
      ? 'ON DELETE RESTRICT'
      : deletion_action === FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT
      ? 'ON DELETE SET DEFAULT'
      : deletion_action === FOREIGN_KEY_CASCADE_ACTION.SET_NULL
      ? 'ON DELETE SET NULL'
      : ''
  const updateAction =
    update_action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON UPDATE CASCADE'
      : update_action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
      ? 'ON UPDATE RESTRICT'
      : ''

  const query = `
    ALTER TABLE "${relationship.source_schema}"."${relationship.source_table_name}"
    ADD CONSTRAINT "${relationship.source_table_name}_${relationship.source_column_name}_fkey"
    FOREIGN KEY ("${relationship.source_column_name}")
    REFERENCES "${relationship.target_table_schema}"."${relationship.target_table_name}" ("${relationship.target_column_name}")
    ${updateAction}
    ${deletionAction};
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

export const removeForeignKey = async (
  projectRef: string,
  connectionString: string | undefined,
  relationship: Partial<PostgresRelationship>
) => {
  const constraintName =
    relationship.constraint_name ||
    `${relationship.source_table_name}_${relationship.source_column_name}_fkey`
  const query = `
    ALTER TABLE "${relationship.source_schema}"."${relationship.source_table_name}"
    DROP CONSTRAINT IF EXISTS "${constraintName}"
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
  foreignKey,
}: {
  projectRef: string
  connectionString: string | undefined
  payload: CreateColumnPayload
  selectedTable: PostgresTable
  foreignKey?: ExtendedPostgresRelationship
}) => {
  const toastId = toast.loading(`Creating column "${payload.name}"...`)
  try {
    // Once pg-meta supports composite keys, we can remove this logic
    const { isPrimaryKey, ...formattedPayload } = payload
    const column = await createDatabaseColumn({
      projectRef: projectRef,
      connectionString: connectionString,
      payload: formattedPayload,
    })

    // Firing createColumn in createTable will bypass this block
    if (isPrimaryKey) {
      toast.loading('Assigning primary key to column...', { id: toastId })
      // Same logic in createTable: Remove any primary key constraints first (we'll add it back later)
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      if (existingPrimaryKeys.length > 0) {
        await removePrimaryKey(projectRef, connectionString, column.schema, column.table)
      }

      const primaryKeyColumns = existingPrimaryKeys.concat([column.name])
      await addPrimaryKey(
        projectRef,
        connectionString,
        column.schema,
        column.table,
        primaryKeyColumns
      )
    }

    if (foreignKey !== undefined) {
      toast.loading('Adding foreign key to column...', { id: toastId })
      await addForeignKey(projectRef, connectionString, foreignKey)
    }

    toast.success(`Successfully created column "${column.name}"`, { id: toastId })
  } catch (error: any) {
    toast.error(`An error occurred while creating the column "${payload.name}"`, { id: toastId })
    return { error }
  }
}

export const updateColumn = async ({
  projectRef,
  connectionString,
  id,
  payload,
  selectedTable,
  foreignKey,
  skipPKCreation,
  skipSuccessMessage = false,
}: {
  projectRef: string
  connectionString: string | undefined
  id: string
  payload: UpdateColumnPayload
  selectedTable: PostgresTable
  foreignKey?: ExtendedPostgresRelationship
  skipPKCreation?: boolean
  skipSuccessMessage?: boolean
}) => {
  try {
    const { isPrimaryKey, ...formattedPayload } = payload
    const column = await updateDatabaseColumn({
      projectRef: projectRef,
      connectionString: connectionString,
      id,
      payload: formattedPayload,
    })

    const originalColumn = find(selectedTable.columns, { id })
    const existingForeignKey = find(selectedTable.relationships, {
      source_column_name: originalColumn!.name,
    })

    if (!skipPKCreation && isPrimaryKey !== undefined) {
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      // Primary key is getting updated for the column
      if (existingPrimaryKeys.length > 0) {
        await removePrimaryKey(projectRef, connectionString, column.schema, column.table)
      }

      const primaryKeyColumns = isPrimaryKey
        ? existingPrimaryKeys.concat([column.name])
        : existingPrimaryKeys.filter((x) => x !== column.name)

      if (primaryKeyColumns.length) {
        await addPrimaryKey(
          projectRef,
          connectionString,
          column.schema,
          column.table,
          primaryKeyColumns
        )
      }
    }

    // For updating of foreign key relationship, we remove the original one by default
    // Then just add whatever was in foreignKey - simplicity over trying to derive whether to update or not
    if (existingForeignKey !== undefined) {
      await removeForeignKey(projectRef, connectionString, existingForeignKey)
    }

    if (foreignKey !== undefined) {
      await addForeignKey(projectRef, connectionString, foreignKey)
    }

    if (!skipSuccessMessage) {
      toast.success(`Successfully updated column "${column.name}"`)
    }
  } catch (error: any) {
    return { error }
  }
}
