import { PostgresRelationship } from '@supabase/postgres-meta'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { getViews } from 'data/views/views-query'
import { useStore } from 'hooks'
import { useEffect, useState } from 'react'
import { IMetaStore } from 'stores/pgmeta/MetaStore'
import { ExtendedPostgresRelationship } from './SidePanelEditor.types'

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
