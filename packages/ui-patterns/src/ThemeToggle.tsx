'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Theme,
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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Conditionally force the theme to 'dark' when disabled is true
  const currentTheme = forceDark ? 'dark' : theme

  if (!isMounted) return null

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
          {resolvedTheme === 'dark' ? (
            <Moon className="h-[20px] w-[20px] rotate-90 transition-all dark:rotate-0" />
          ) : (
            <Sun className="w-[20px] h-[20px] rotate-0 transition-all dark:-rotate-90" />
          )}
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
