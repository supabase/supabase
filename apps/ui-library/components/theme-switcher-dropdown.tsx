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
  RadioGroup_Shadcn_,
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

  function SingleThemeSelection() {
    return (
      <form>
        <RadioGroup_Shadcn_
          name="theme"
          onValueChange={setTheme}
          aria-label="Choose a theme"
          defaultValue={theme}
          value={theme}
          className="flex flex-wrap gap-3"
        ></RadioGroup_Shadcn_>
      </form>
    )
  }

  const iconClasses = 'text-foreground-light group-data-[state=open]:text-foreground'

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
          ></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
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
