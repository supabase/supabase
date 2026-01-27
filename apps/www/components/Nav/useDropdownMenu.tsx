'use client'

import type { User } from '@supabase/supabase-js'
import { logOut } from 'common'
import { Command, Database, LogOut, Settings, UserIcon } from 'lucide-react'
import { useRouter } from 'next/compat/router'
import { useSetCommandMenuOpen } from 'ui-patterns'
import type { menuItem } from 'ui-patterns/AuthenticatedDropdownMenu'

const useDropdownMenu = (user: User | null) => {
  const router = useRouter()
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
        onClick: async () => {
          await logOut()
          router?.reload()
        },
      },
    ],
  ]

  return menu
}

export default useDropdownMenu
