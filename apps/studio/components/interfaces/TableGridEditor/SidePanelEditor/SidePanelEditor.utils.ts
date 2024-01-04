import { getViews } from 'data/views/views-query'
import { useStore } from 'hooks'
import { useEffect, useState } from 'react'
import { IMetaStore } from 'stores/pgmeta/MetaStore'

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
