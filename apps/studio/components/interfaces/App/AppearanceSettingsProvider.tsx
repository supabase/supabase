import { useIsomorphicLayoutEffect } from 'common'
import { useTheme } from 'next-themes'

import { useTextSize } from '@/hooks/misc/useTextSize'
import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyTextSize } from '@/lib/text-size'
import { applyResolvedThemeOverrides } from '@/lib/theme-overrides'

export const AppearanceSettingsProvider = () => {
  const { resolvedTheme } = useTheme()
  const { mode, overrides } = useThemeOverrides()
  const { textSize } = useTextSize()

  useIsomorphicLayoutEffect(() => {
    if (resolvedTheme !== undefined) {
      applyResolvedThemeOverrides(document.documentElement, resolvedTheme, mode, overrides)
    }
    applyTextSize(document.documentElement, textSize)
  }, [mode, overrides, resolvedTheme, textSize])

  return null
}
