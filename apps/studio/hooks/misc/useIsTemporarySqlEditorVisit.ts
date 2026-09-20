import { LOCAL_STORAGE_KEYS } from 'common'

import { useLocalStorageQuery } from './useLocalStorage'

export const useIsTemporarySqlEditorVisit = (ref: string | undefined) => {
  const [isTemporary, setIsTemporary] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_TEMPORARY_FROM_EXPLORER(ref ?? ''),
    false
  )

  return { isTemporary, setIsTemporary }
}
