'use client'

import { logOut, useUser } from 'common/auth'
import { Command } from 'lucide-react'
import { useTheme } from 'next-themes'
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, KeyboardShortcut } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import {
  TopNavAccountItems,
  TopNavDropdown,
  TopNavSignOutItem,
  TopNavThemeGroup,
} from 'ui-patterns/TopNav/TopNavDropdown'

export const AccountMenu = () => {
  const user = useUser()
  const { theme, setTheme } = useTheme()
  const setCommandMenuOpen = useSetCommandMenuOpen()

  const handleCommandMenuSelect = () => setCommandMenuOpen(true)

  const handleSignOut = async () => {
    await logOut()
    window.location.reload()
  }

  return (
    <TopNavDropdown>
      <TopNavAccountItems email={user?.email} />
      <DropdownMenuItem className="gap-2" onSelect={handleCommandMenuSelect}>
        <Command aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
        Command Menu
        <DropdownMenuShortcut>
          <KeyboardShortcut keys={['Meta', 'K']} variant="inline" />
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <TopNavThemeGroup value={theme} onValueChange={setTheme} />
      <DropdownMenuSeparator />
      <TopNavSignOutItem onSelect={handleSignOut} />
    </TopNavDropdown>
  )
}
