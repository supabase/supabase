import { useIsomorphicLayoutEffect } from 'common'
import { useTheme } from 'next-themes'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { resolvedTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()

  useIsomorphicLayoutEffect(() => {
    if (resolvedTheme === undefined) return
    applyThemeOverrides(document.documentElement, mode, overrides)
  }, [mode, overrides, resolvedTheme])

  return null
}
