import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { useTheme } from 'next-themes'
import { useCallback, useMemo } from 'react'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import {
  clearThemeOverridesForMode,
  mergeThemeOverride,
  parseThemeOverridesByMode,
  resolveThemeOverrideMode,
  ThemeOverrideKey,
  ThemeOverrideMode,
  ThemeOverrides,
  ThemeOverridesByMode,
} from '@/lib/theme-overrides'

const EMPTY_OVERRIDES: ThemeOverrides = {}

function readStoredThemeOverrides(): ThemeOverridesByMode {
  const stored = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.UI_THEME_OVERRIDES)
  if (stored === null) return {}

  try {
    return parseThemeOverridesByMode(JSON.parse(stored))
  } catch {
    return {}
  }
}

/**
 * Reads and writes the colour-system overrides for the currently resolved
 * theme mode. Stored alongside the other appearance preferences in
 * localStorage under a single key, keyed by mode.
 */
export function useThemeOverrides() {
  const { resolvedTheme } = useTheme()
  const mode: ThemeOverrideMode = resolveThemeOverrideMode(resolvedTheme)

  const [storedOverrides, setStoredOverrides] = useLocalStorageQuery<unknown>(
    LOCAL_STORAGE_KEYS.UI_THEME_OVERRIDES,
    readStoredThemeOverrides()
  )
  const overridesByMode = useMemo(
    () => parseThemeOverridesByMode(storedOverrides),
    [storedOverrides]
  )

  const overrides = overridesByMode[mode] ?? EMPTY_OVERRIDES

  const setOverride = useCallback(
    (key: ThemeOverrideKey, value: number) => {
      setStoredOverrides((current: unknown) =>
        mergeThemeOverride(parseThemeOverridesByMode(current), mode, key, value)
      )
    },
    [mode, setStoredOverrides]
  )

  const resetOverrides = useCallback(() => {
    setStoredOverrides((current: unknown) =>
      clearThemeOverridesForMode(parseThemeOverridesByMode(current), mode)
    )
  }, [mode, setStoredOverrides])

  return useMemo(
    () => ({ mode, overrides, setOverride, resetOverrides }),
    [mode, overrides, setOverride, resetOverrides]
  )
}
