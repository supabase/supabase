import { useTheme } from 'next-themes'
import { useLayoutEffect } from 'react'

import { useTextSize } from '@/hooks/misc/useTextSize'
import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyTextSize } from '@/lib/text-size'
import { applyThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { theme, setTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()
  const { textSize } = useTextSize()

  useLayoutEffect(() => {
    if (theme === 'classic-dark') setTheme('dark')
    applyThemeOverrides(document.documentElement, mode, overrides)
    applyTextSize(document.documentElement, textSize)
  }, [mode, overrides, setTheme, textSize, theme])

  return null
}
