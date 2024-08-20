'use client'

import React, { Fragment } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Home, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Theme,
  buttonVariants,
  cn,
  themes,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { logOut, useUser } from 'common'
import { LucideIcon } from 'icons/src/createSupabaseIcon'

const AuthenticatedDropdownMenu = () => {
  const { theme, setTheme } = useTheme()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const user = useUser()

  interface menuItem {
    label: string
    type?: 'link' | 'button' | 'text'
    icon?: LucideIcon
    href?: string
    shortcut?: string
    onClick?: VoidFunction
    otherProps?: {
      target?: '_blank'
      rel?: 'noreferrer noopener'
    }
  }

  const menu: menuItem[][] = [
    [
      {
        label: user?.email ?? '',
        type: 'text',
        icon: User,
      },
      {
        label: 'Projects',
        icon: Home,
        href: 'https://supabase.com/dashboard/projects',
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

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="flex">
        <button
          title="Menu dropdown button"
          className={cn(
            buttonVariants({ type: 'default' }),
            'text-foreground-light border-default w-[26px] min-w-[26px] h-[26px] data-[state=open]:bg-overlay-hover/30 hover:border-strong data-[state=open]:border-stronger hover:!bg-overlay-hover/50 bg-transparent'
          )}
        >
          <Menu size={16} strokeWidth={1} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {menu.map((menuSection, sectionIdx) => (
          <Fragment key={`topnav--${sectionIdx}`}>
            {sectionIdx !== 0 && <DropdownMenuSeparator key={`topnav--${sectionIdx}`} />}
            {menuSection.map(({ icon: Icon, ...sectionItem }, itemIdx) => {
              switch (sectionItem.type) {
                case 'text':
                  return (
                    <div
                      key={`topnav-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      className="flex cursor-text items-center text-foreground rounded-sm px-2 py-1.5 text-xs outline-none space-x-2"
                      {...sectionItem.otherProps}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      <span className="grow truncate">{sectionItem.label}</span>
                      {sectionItem.shortcut && (
                        <DropdownMenuShortcut>{sectionItem.shortcut}</DropdownMenuShortcut>
                      )}
                    </div>
                  )
                case 'button':
                  return (
                    <DropdownMenuItem
                      key={`topnav-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      className="space-x-2"
                      onClick={sectionItem.onClick!}
                      {...sectionItem.otherProps}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      <span className="grow">{sectionItem.label}</span>
                      {sectionItem.shortcut && (
                        <DropdownMenuShortcut>{sectionItem.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  )
                default:
                  return (
                    <Link
                      key={`topnav-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      href={sectionItem.href!}
                      {...sectionItem.otherProps}
                    >
                      <DropdownMenuItem className="space-x-2" onClick={() => {}}>
                        {Icon && <Icon className="w-3 h-3" />}
                        <span className="grow">{sectionItem.label}</span>
                        {sectionItem.shortcut && (
                          <DropdownMenuShortcut>{sectionItem.shortcut}</DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    </Link>
                  )
              }
            })}
          </Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {themes
              .filter((x) => x.value === 'light' || x.value === 'dark' || x.value === 'system')
              .map((theme: Theme) => (
                <DropdownMenuRadioItem key={`topnav-theme-${theme.value}`} value={theme.value}>
                  {theme.name}
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AuthenticatedDropdownMenu
