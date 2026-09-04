import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'
import { useCallback, useMemo } from 'react'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import {
  clearThemeOverridesForMode,
  mergeThemeOverride,
  resolveThemeOverrideMode,
  ThemeOverrideKey,
  ThemeOverrideMode,
  ThemeOverrides,
  ThemeOverridesByMode,
} from '@/lib/theme-overrides'

const EMPTY_OVERRIDES: ThemeOverrides = {}

/**
 * Reads and writes the colour-system overrides for the currently resolved
 * theme mode. Stored alongside the other appearance preferences in
 * localStorage under a single key, keyed by mode.
 */
export function useThemeOverrides() {
  const { resolvedTheme } = useTheme()
  const mode: ThemeOverrideMode = resolveThemeOverrideMode(resolvedTheme)

  const [overridesByMode, setOverridesByMode] = useLocalStorageQuery<ThemeOverridesByMode>(
    LOCAL_STORAGE_KEYS.UI_THEME_OVERRIDES,
    {}
  )

  const overrides = overridesByMode[mode] ?? EMPTY_OVERRIDES

  const setOverride = useCallback(
    (key: ThemeOverrideKey, value: number) => {
      setOverridesByMode((current) => mergeThemeOverride(current, mode, key, value))
    },
    [mode, setOverridesByMode]
  )

  const resetOverrides = useCallback(() => {
    setOverridesByMode((current) => clearThemeOverridesForMode(current, mode))
  }, [mode, setOverridesByMode])

  return useMemo(
    () => ({ mode, overrides, setOverride, resetOverrides }),
    [mode, overrides, setOverride, resetOverrides]
  )
}
