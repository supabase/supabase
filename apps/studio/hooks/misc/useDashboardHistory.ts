import { LOCAL_STORAGE_KEYS, useParams } from 'common'

import { useLocalStorageQuery } from './useLocalStorage'

type DashboardHistory = { editor?: string; sql?: string }
const DEFAULT_HISTORY = { editor: undefined, sql: undefined }

export const useDashboardHistory = () => {
  // [Joshen] History should always refer to the project that the user is currently on
  const { ref } = useParams()

  const [history, setHistory, { isSuccess }] = useLocalStorageQuery<DashboardHistory>(
    LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY(ref ?? ''),
    DEFAULT_HISTORY
  )

  const setLastVisitedTable = (id?: string) => {
    setHistory({ ...history, editor: id })
  }

  const setLastVisitedSnippet = (id?: string) => {
    setHistory({ ...history, sql: id })
  }

  /**
   * Purge the last-visited snippet when it's one of the deleted snippets, so that
   * navigating back to the SQL editor doesn't resurrect a deleted snippet.
   */
  const clearSnippetsFromHistory = (ids: string[]) => {
    setHistory((current) =>
      current.sql !== undefined && ids.includes(current.sql)
        ? { ...current, sql: undefined }
        : current
    )
  }

  return {
    history,
    setLastVisitedTable,
    setLastVisitedSnippet,
    clearSnippetsFromHistory,
    isHistoryLoaded: isSuccess,
  }
}
