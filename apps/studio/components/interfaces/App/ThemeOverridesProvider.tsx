import { useEffect } from 'react'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { applyThemeOverrides } from '@/lib/theme-overrides'

/**
 * Applies the stored colour-system overrides to the document element. Like
 * MonacoThemeProvider this renders nothing; it exists so the effect can sit
 * inside ThemeProvider and react to the resolved theme.
 */
export const ThemeOverridesProvider = () => {
  const { overrides } = useThemeOverrides()

  useEffect(() => {
    applyThemeOverrides(document.documentElement, overrides)
  }, [overrides])

  return null
}
