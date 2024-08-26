'use client'

import type { User } from '@supabase/supabase-js'
import { LogOut, Globe, LifeBuoy, Settings, UserIcon } from 'lucide-react'
import { logOut } from 'common'

import type { menuItem } from 'ui-patterns/AuthenticatedDropdownMenu'
import { IconGitHub } from './MenuIcons'

const useDropdownMenu = (user: User | null) => {
  console.log(user)
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
  ]

  return menu
}

export default useDropdownMenu
