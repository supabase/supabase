import { LOCAL_STORAGE_KEYS } from 'common'
import { useEffect } from 'react'

import { isValidConnString } from '@/data/fetchers'
import { useReadReplicasQuery, type Database } from '@/data/read-replicas/replicas-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import {
  useDatabaseSelectorStateSnapshot,
  useGetSelectedDatabaseId,
} from '@/state/database-selector'

export function getDefaultDatabaseId({
  databases,
  ref,
  lastSelectedDatabase,
}: {
  databases: Pick<Database, 'identifier'>[]
  ref: string | undefined
  lastSelectedDatabase: string
}): string | undefined {
  const lastSelectedIsStillValid = databases.some((db) => db.identifier === lastSelectedDatabase)
  if (lastSelectedIsStillValid) return lastSelectedDatabase

  return databases.find((db) => db.identifier === ref)?.identifier
}

/**
 * Defaults the SQL editor's selected database once read replicas load
 */
export function useSqlEditorDatabaseSelection({
  ref,
  connectionString,
}: {
  ref: string | undefined
  connectionString: string | null | undefined
}) {
  const { setSelectedDatabaseId } = useDatabaseSelectorStateSnapshot()
  const getSelectedDatabaseId = useGetSelectedDatabaseId()

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery(
    { projectRef: ref },
    { enabled: isValidConnString(connectionString) }
  )
  const [lastSelectedDatabase, , { isLoading: isLoadingLastSelectedDatabase }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref ?? ''), '')

  useEffect(() => {
    // Only set the initial selection once, when nothing has been selected yet.
    if (
      isSuccessReadReplicas &&
      !isLoadingLastSelectedDatabase &&
      getSelectedDatabaseId() === undefined
    ) {
      setSelectedDatabaseId(getDefaultDatabaseId({ databases, ref, lastSelectedDatabase }))
    }
  }, [
    isSuccessReadReplicas,
    isLoadingLastSelectedDatabase,
    databases,
    ref,
    lastSelectedDatabase,
    setSelectedDatabaseId,
    getSelectedDatabaseId,
  ])
}
