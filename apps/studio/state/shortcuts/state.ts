import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback } from 'react'

import type { ShortcutId } from './registry'
import { DisabledShortcuts } from './types'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const STORAGE_KEY = LOCAL_STORAGE_KEYS.SHORTCUT_STORAGE_KEY

const DEFAULT_DISABLED: DisabledShortcuts = {}

export function useShortcutPreferences() {
  const [disabled, setDisabled] = useLocalStorageQuery<DisabledShortcuts>(
    STORAGE_KEY,
    DEFAULT_DISABLED
  )

  const setShortcutEnabled = useCallback(
    (id: ShortcutId, enabled: boolean) => {
      setDisabled((prev) => {
        if (enabled) {
          const { [id]: _removed, ...rest } = prev
          return rest
        }
        return { ...prev, [id]: true }
      })
    },
    [setDisabled]
  )

  const resetShortcut = useCallback(
    (id: ShortcutId) => {
      setDisabled((prev) => {
        const { [id]: _removed, ...rest } = prev
        return rest
      })
    },
    [setDisabled]
  )

  const resetAllShortcuts = useCallback(() => {
    setDisabled(DEFAULT_DISABLED)
  }, [setDisabled])

  return {
    disabled,
    setShortcutEnabled,
    resetShortcut,
    resetAllShortcuts,
  }
}
