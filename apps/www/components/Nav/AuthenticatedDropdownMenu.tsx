'use client'

import React, { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Home, LogOut, Search, Settings, UserIcon } from 'lucide-react'
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
import { logOut } from 'common'

import type { User } from '@supabase/supabase-js'
import type { LucideIcon } from 'icons/src/createSupabaseIcon'

interface Props {
  user: User | null
}

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

const AuthenticatedDropdownMenu = ({ user }: Props) => {
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const { theme, setTheme } = useTheme()
  const userAvatar = user && user.user_metadata?.avatar_url

  const menu: menuItem[][] = [
    [
      {
        label: user?.email ?? '',
        type: 'text',
        icon: UserIcon,
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
            'text-foreground-light border-default w-[26px] min-w-[26px] h-[26px] data-[state=open]:bg-overlay-hover/30 hover:border-strong data-[state=open]:border-stronger hover:!bg-overlay-hover/50 bg-transparent',
            'rounded-full overflow-hidden'
          )}
        >
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={user?.email ?? ''}
              placeholder="blur"
              blurDataURL="/images/blur.png"
              fill
              sizes="30px"
              className="object-cover object-center"
            />
          ) : (
            <UserIcon size={16} strokeWidth={1.5} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {menu.map((menuSection, sectionIdx) => (
          <Fragment key={`topnav--${sectionIdx}`}>
            {sectionIdx !== 0 && <DropdownMenuSeparator key={`topnav--${sectionIdx}`} />}
            {menuSection.map((sectionItem, itemIdx) => {
              switch (sectionItem.type) {
                case 'text':
                  return (
                    <div
                      key={`topnav-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      className="flex cursor-text items-center text-foreground rounded-sm px-2 py-1.5 text-xs outline-none space-x-2"
                      {...sectionItem.otherProps}
                    >
                      <DropdownItemContent {...sectionItem} />
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
                      <DropdownItemContent {...sectionItem} />
                    </DropdownMenuItem>
                  )
                case 'link':
                default:
                  return (
                    <Link
                      key={`topnav-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      href={sectionItem.href!}
                      {...sectionItem.otherProps}
                    >
                      <DropdownMenuItem className="space-x-2" onClick={() => {}}>
                        <DropdownItemContent {...sectionItem} />
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

const DropdownItemContent = ({ icon: Icon, ...sectionItem }: menuItem) => (
  <>
    {Icon && <Icon className="w-3 h-3" />}
    <span className="grow truncate">{sectionItem.label}</span>
    {sectionItem.shortcut && <DropdownMenuShortcut>{sectionItem.shortcut}</DropdownMenuShortcut>}
  </>
)

export default AuthenticatedDropdownMenu
