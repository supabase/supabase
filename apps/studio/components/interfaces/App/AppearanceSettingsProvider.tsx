import { useTheme } from 'next-themes'
import { useLayoutEffect } from 'react'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { theme, setTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()
  useLayoutEffect(() => {
    if (theme === 'classic-dark') setTheme('dark')
    applyThemeOverrides(document.documentElement, mode, overrides)
  }, [mode, overrides, setTheme, theme])

  return null
}
