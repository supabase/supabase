import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback } from 'react'

import {
  STORAGE_BUCKET_SORT,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from '../Storage.constants'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

interface StoragePreference {
  view: STORAGE_VIEWS
  sortBy: STORAGE_SORT_BY
  sortByOrder: STORAGE_SORT_BY_ORDER
  sortBucket: STORAGE_BUCKET_SORT
}

const DEFAULT_PREFERENCES: StoragePreference = {
  view: STORAGE_VIEWS.COLUMNS,
  sortBy: STORAGE_SORT_BY.NAME,
  sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
  sortBucket: STORAGE_BUCKET_SORT.CREATED_AT,
}

/**
 * Read the current storage preference directly from localStorage.
 * Use this outside of React (e.g. inside Valtio state methods).
 */
export function getStoragePreference(projectRef: string): StoragePreference {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef))
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
    }
  } catch {}
  return DEFAULT_PREFERENCES
}

export function useStoragePreference(projectRef: string) {
  const [preference, setPreference] = useLocalStorageQuery<StoragePreference>(
    LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef),
    DEFAULT_PREFERENCES
  )

  const setView = useCallback(
    (view: STORAGE_VIEWS) => {
      setPreference((prev) => ({ ...prev, view }))
    },
    [setPreference]
  )

  const setSortBy = useCallback(
    (sortBy: STORAGE_SORT_BY) => {
      setPreference((prev) => ({ ...prev, sortBy }))
    },
    [setPreference]
  )

  const setSortByOrder = useCallback(
    (sortByOrder: STORAGE_SORT_BY_ORDER) => {
      setPreference((prev) => ({ ...prev, sortByOrder }))
    },
    [setPreference]
  )

  const setSortBucket = useCallback(
    (sortBucket: STORAGE_BUCKET_SORT) => {
      setPreference((prev) => ({ ...prev, sortBucket }))
    },
    [setPreference]
  )

  return {
    view: preference.view,
    sortBy: preference.sortBy,
    sortByOrder: preference.sortByOrder,
    sortBucket: preference.sortBucket,
    setView,
    setSortBy,
    setSortByOrder,
    setSortBucket,
  }
}
