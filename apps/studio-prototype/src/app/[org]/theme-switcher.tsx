'use client'

import { useTheme } from 'next-themes'
import { DropdownMenuRadioGroup, DropdownMenuRadioItem, Theme, singleThemes } from 'ui'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={(themeValue) => setTheme(themeValue)}>
      {singleThemes.map((theme: Theme) => (
        <DropdownMenuRadioItem key={theme.value} value={theme.value}>
          {theme.name}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}
