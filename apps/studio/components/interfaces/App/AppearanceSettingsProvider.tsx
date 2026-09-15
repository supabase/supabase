import { useIsomorphicLayoutEffect } from 'common'
import { useTheme } from 'next-themes'

import { useTextSize } from '@/hooks/misc/useTextSize'
import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyTextSize } from '@/lib/text-size'
import { applyThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { resolvedTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()
  const { textSize } = useTextSize()

  useIsomorphicLayoutEffect(() => {
    if (resolvedTheme === 'classic-dark') {
      applyThemeOverrides(document.documentElement, 'dark', {})
    } else if (resolvedTheme !== undefined) {
      applyThemeOverrides(document.documentElement, mode, overrides)
    }
    applyTextSize(document.documentElement, textSize)
  }, [mode, overrides, resolvedTheme, textSize])

  return null
}
