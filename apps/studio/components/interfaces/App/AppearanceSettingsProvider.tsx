import { useFlag, useIsomorphicLayoutEffect } from 'common'
import { useTheme } from 'next-themes'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import {
  APPEARANCE_SPOT_COLOR_FLAG,
  applyThemeOverrides,
  resolveThemeOverridesForFlags,
} from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { resolvedTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()
  const isSpotColorEnabled = useFlag(APPEARANCE_SPOT_COLOR_FLAG)
  const effectiveOverrides = resolveThemeOverridesForFlags(overrides, { isSpotColorEnabled })

  useIsomorphicLayoutEffect(() => {
    if (resolvedTheme === undefined) return
    applyThemeOverrides(document.documentElement, mode, effectiveOverrides)
  }, [mode, effectiveOverrides, resolvedTheme])

  return null
}
