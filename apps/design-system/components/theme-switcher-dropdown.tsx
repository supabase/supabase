'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  singleThemes,
  Theme,
} from 'ui'

const ThemeSwitcherDropdown = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  /**
   * Avoid Hydration Mismatch
   * https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
   */
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const iconClasses = 'text-foreground-lighter group-data-[state=open]:text-foreground'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="text"
            size="tiny"
            className="px-1 group"
            icon={
              resolvedTheme?.includes('light') ? (
                <Sun className={iconClasses} />
              ) : (
                <Moon className={iconClasses} />
              )
            }
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(themeValue) => setTheme(themeValue)}
          >
            {singleThemes.map((theme: Theme) => (
              <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export { ThemeSwitcherDropdown }
