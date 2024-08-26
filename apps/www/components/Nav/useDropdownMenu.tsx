'use client'

import type { User } from '@supabase/supabase-js'
import { LogOut, Settings, Search, UserIcon } from 'lucide-react'
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
        label: 'Logout',
        type: 'button',
        icon: LogOut,
        onClick: () => logOut(),
      },
    ],
    [
      {
        label: 'Search',
        type: 'button',
        icon: Search,
        onClick: () => setCommandMenuOpen(true),
        shortcut: '⌘K',
      },
    ],
  ]

  return menu
}

export default useDropdownMenu
