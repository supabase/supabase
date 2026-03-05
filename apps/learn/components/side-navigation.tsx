'use client'

import Link from 'next/link'
import { useIsLoggedIn, useUser, logOut } from 'common'
import { AuthenticatedDropdownMenu, type menuItem } from 'ui-patterns'
import { LogOut, Settings, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import NavigationItem from '@/components/side-navigation-item'
import { courses } from '@/config/docs'
import { mergeInternalContentIntoSections } from '@/lib/merge-internal-content'
import { SidebarNavItem } from '@/types/nav'
import { CommandMenu } from './command-menu'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'

interface SideNavigationProps {
  internalPaths: string[]
}

function SideNavigation({ internalPaths }: SideNavigationProps) {
  const isLoggedIn = useIsLoggedIn()
  const user = useUser()
  const router = useRouter()

  // First, merge orphaned internal content into their respective sections
  // Note: All content is visible to everyone. Auth is only for saving progress.
  const coursesWithInternalContent = {
    ...courses,
    items: mergeInternalContentIntoSections(courses.items, internalPaths),
  }

  // User menu for authenticated dropdown
  const userMenu: menuItem[][] = [
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
    ],
    [
      {
        label: 'Logout',
        type: 'button',
        icon: LogOut,
        onClick: async () => {
          await logOut()
          router.refresh()
        },
      },
    ],
  ]

  return (
    <nav className="flex flex-col h-full min-w-[220px]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <Link href="/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="109"
                height="113"
                viewBox="0 0 109 113"
                fill="none"
                className="w-6 h-6"
              >
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0625L99.1935 40.0625C107.384 40.0625 111.952 49.5226 106.859 55.9372L63.7076 110.284Z"
                  fill="url(#paint0_linear)"
                />
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0625L99.1935 40.0625C107.384 40.0625 111.952 49.5226 106.859 55.9372L63.7076 110.284Z"
                  fill="url(#paint1_linear)"
                  fillOpacity="0.2"
                />
                <path
                  d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                  fill="#3ECF8E"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear"
                    x1="53.9738"
                    y1="54.9738"
                    x2="94.1635"
                    y2="71.8293"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#249361" />
                    <stop offset="1" stopColor="#3ECF8E" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear"
                    x1="36.1558"
                    y1="30.5779"
                    x2="54.4844"
                    y2="65.0804"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop />
                    <stop offset="1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </Link>
            <ThemeSwitcherDropdown />
          </div>
          <Link href="/" className="mb-4 block">
            <h1>Learn Supabase</h1>
          </Link>
          {/* <TopNavigationSearch /> */}
          <CommandMenu />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="pb-6 px-6">
            <h3 className="text-xs font-semibold text-foreground-lighter/75 uppercase tracking-wider mb-3">
              {courses.title}
            </h3>
            <ul className="space-y-1">
              {coursesWithInternalContent.items.map((item: SidebarNavItem, i: number) => (
                <NavigationItem
                  item={item}
                  key={`${item.href}-${i}`}
                  internalPaths={internalPaths}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-muted/50 p-4 flex-shrink-0">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <AuthenticatedDropdownMenu menu={userMenu} user={user} site="docs" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Link
              href="https://supabase.com/dashboard/sign-in"
              className="text-sm text-foreground-light hover:text-foreground transition-colors underline decoration-1 underline-offset-4"
            >
              Sign in to save your progress
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default SideNavigation
