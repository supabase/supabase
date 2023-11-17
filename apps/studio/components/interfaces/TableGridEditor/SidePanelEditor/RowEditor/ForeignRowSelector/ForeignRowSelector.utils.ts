import { useStore } from 'hooks'
import { useEffect, useState } from 'react'

export interface UseEncryptedColumnsArgs {
  schemaName?: string
  tableName?: string
}

export function useEncryptedColumns({ schemaName, tableName }: UseEncryptedColumnsArgs) {
  const { vault } = useStore()
  const [encryptedColumns, setEncryptedColumns] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const getEncryptedColumns = async () => {
      if (schemaName !== undefined && tableName !== undefined) {
        const columns = await vault.listEncryptedColumns(schemaName, tableName)

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
