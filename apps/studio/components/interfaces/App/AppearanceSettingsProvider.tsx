import { useIsomorphicLayoutEffect } from 'common'
import { useTheme } from 'next-themes'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { resolvedTheme, theme, setTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()

  useIsomorphicLayoutEffect(() => {
    if (theme === 'classic-dark') setTheme('dark')
    if (resolvedTheme === undefined) return

    applyThemeOverrides(document.documentElement, mode, overrides)
  }, [mode, overrides, resolvedTheme, setTheme, theme])

  return null
}
