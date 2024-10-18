'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Theme,
  cn,
  themes,
} from 'ui'

interface ThemeToggleProps {
  forceDark?: boolean
  triggerClassName?: string
  contentClassName?: string
}

export const ThemeToggle = ({
  forceDark = false,
  triggerClassName,
  contentClassName,
}: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  // Conditionally force the theme to 'dark' when disabled is true
  const currentTheme = forceDark ? 'dark' : theme

  return (
    <DropdownMenu open={open} onOpenChange={() => setOpen(!open)} modal={false}>
      <DropdownMenuTrigger asChild disabled={forceDark}>
        <button
          id="user-settings-dropdown"
          className={cn(
            'flex items-center justify-center h-7 w-7 text-foreground-light',
            triggerClassName
          )}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn('w-60', contentClassName)}>
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={currentTheme} // Use the currentTheme variable here
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {themes
              .filter((x) => x.value === 'dark' || x.value === 'light' || x.value === 'system')
              .map((theme: Theme) => (
                <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                  {theme.name}
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
