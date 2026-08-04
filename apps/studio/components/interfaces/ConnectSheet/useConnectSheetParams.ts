import { LOCAL_STORAGE_KEYS } from 'common'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

import { useLocalStorage } from '@/hooks/misc/useLocalStorage'

export type ConnectSheetPrefs = {
  connectTab?: string
  framework?: string
  using?: string
  method?: string
  type?: string
  mcpClient?: string
}

const DEFAULT_CONNECT_SHEET_PREFS: ConnectSheetPrefs = {}

type ConnectParamKey = keyof ConnectSheetPrefs
type ConnectParamUpdates = Partial<Record<ConnectParamKey, string | null>>

/**
 * Owns the URL params + localStorage that drive the Connect sheet's initial
 * state. `setConnectParams` mirrors writes to both. `setQueryParams` writes
 * the URL only — used to clear URL on close and to hydrate URL from storage
 * on open (where storage is already the source of truth).
 */
export function useConnectSheetParams() {
  const [params, setQueryParams] = useQueryStates({
    connectTab: parseAsString,
    framework: parseAsString,
    using: parseAsString,
    method: parseAsString,
    type: parseAsString,
    mcpClient: parseAsString,
  })

  const [storedPrefs, setStoredPrefs] = useLocalStorage<ConnectSheetPrefs>(
    LOCAL_STORAGE_KEYS.CONNECT_SHEET_PREFS,
    DEFAULT_CONNECT_SHEET_PREFS
  )

  const setConnectParams = useCallback(
    (updates: ConnectParamUpdates) => {
      setQueryParams(updates)
      setStoredPrefs((prev) => {
        const next: ConnectSheetPrefs = { ...prev }
        for (const key of Object.keys(updates) as ConnectParamKey[]) {
          // null in URL maps to undefined in storage so the preference is truly forgotten
          next[key] = updates[key] ?? undefined
        }
        return next
      })
    },
    [setQueryParams, setStoredPrefs]
  )

  return { params, storedPrefs, setConnectParams, setQueryParams }
}
