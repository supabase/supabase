'use client'

import type { User } from '@supabase/supabase-js'
import { LogOut, Globe, LifeBuoy, Settings, UserIcon, Database } from 'lucide-react'
import { logOut } from 'common'

import type { menuItem } from 'ui-patterns/AuthenticatedDropdownMenu'
import { IconGitHub } from './MenuIcons'

const useDropdownMenu = (user: User | null) => {
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
    ],
    [
      {
        label: 'Supabase.com',
        icon: Globe,
        href: 'https://supabase.com',
        otherProps: {
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      },
      {
        label: 'GitHub',
        icon: IconGitHub as any,
        href: 'https://github.com/supabase/supabase',
        otherProps: {
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      },
      {
        label: 'Support',
        icon: LifeBuoy,
        href: 'https://supabase.com/support',
        otherProps: {
          target: '_blank',
          rel: 'noreferrer noopener',
        },
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
          window.location.reload()
        },
      },
    ],
  ]

  return menu
}

export default useDropdownMenu
