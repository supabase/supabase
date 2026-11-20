'use client'

import { ThemeProvider as NextThemesProvider, useTheme, type ThemeProviderProps } from 'next-themes'
import { useEffect } from 'react'

import { migrateLegacyTheme, THEME_DOM_VALUES } from './theme'

function LegacyThemeMigration() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const migratedTheme = migrateLegacyTheme(theme)
    if (migratedTheme !== theme && migratedTheme !== undefined) setTheme(migratedTheme)
  }, [setTheme, theme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={['dark', 'light']}
      value={THEME_DOM_VALUES}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <LegacyThemeMigration />
      {children}
    </NextThemesProvider>
  )
}
