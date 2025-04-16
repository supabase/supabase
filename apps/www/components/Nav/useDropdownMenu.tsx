'use client'

import type { User } from '@supabase/supabase-js'
import { Command, Database, LogOut, Settings, UserIcon } from 'lucide-react'
import { logOut } from 'common'

import type { menuItem } from 'ui-patterns/AuthenticatedDropdownMenu'
import { useSetCommandMenuOpen } from 'ui-patterns'

const useDropdownMenu = (user: User | null) => {
  const setCommandMenuOpen = useSetCommandMenuOpen()

  const menu: menuItem[][] = [
    [
      {
        label: user?.email ?? "You're logged in",
        type: 'text',
        icon: UserIcon,
      },
      {
        label: 'Account Preferences',
        icon: Settings,
        href: 'https://supabase.com/dashboard/account/me',
      },
      {
        label: 'All Projects',
        icon: Database,
        href: 'https://supabase.com/dashboard/projects',
      },
      {
        label: 'Command Menu',
        icon: Command,
        type: 'button',
        onClick: () => setCommandMenuOpen(true),
        shortcut: '⌘K',
      },
    ],
    [
      {
        label: 'Theme',
        type: 'theme',
      },
    ],
    [
      {
        label: 'Logout',
        type: 'button',
        icon: LogOut,
        onClick: () => logOut(),
      },
    ],
  ]

  return menu
}

export default useDropdownMenu
