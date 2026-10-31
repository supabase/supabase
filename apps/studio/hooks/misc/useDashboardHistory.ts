import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useCallback } from 'react'

import { useLocalStorageQuery } from './useLocalStorage'

type ExplorerHistoryEntry = { type: 'notebook' | 'query' | 'chat'; id: string }
type DashboardHistory = { editor?: string; sql?: string; explorer?: ExplorerHistoryEntry }
const DEFAULT_HISTORY = { editor: undefined, sql: undefined, explorer: undefined }

export const useDashboardHistory = () => {
  // [Joshen] History should always refer to the project that the user is currently on
  const { ref } = useParams()

  const [history, setHistory, { isSuccess }] = useLocalStorageQuery<DashboardHistory>(
    LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY(ref ?? ''),
    DEFAULT_HISTORY
  )

  const setLastVisitedTable = useCallback(
    (id?: string) => {
      setHistory((current) => ({ ...current, editor: id }))
    },
    [setHistory]
  )

  const setLastVisitedSnippet = useCallback(
    (id?: string) => {
      setHistory((current) => ({ ...current, sql: id }))
    },
    [setHistory]
  )

  const setLastVisitedExplorerTab = useCallback(
    (entry?: ExplorerHistoryEntry) => {
      setHistory((current) => ({ ...current, explorer: entry }))
    },
    [setHistory]
  )

  /**
   * Purge the last-visited snippet when it's one of the deleted snippets, so that
   * navigating back to the SQL editor doesn't resurrect a deleted snippet.
   */
  const clearSnippetsFromHistory = useCallback(
    (ids: string[]) => {
      setHistory((current) =>
        current.sql !== undefined && ids.includes(current.sql)
          ? { ...current, sql: undefined }
          : current
      )
    },
    [setHistory]
  )

  return {
    history,
    setLastVisitedTable,
    setLastVisitedSnippet,
    setLastVisitedExplorerTab,
    clearSnippetsFromHistory,
    isHistoryLoaded: isSuccess,
  }
}
