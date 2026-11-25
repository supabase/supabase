'use client'

import { useIsUserLoading, useUser, type User } from 'common/auth'
import { DASHBOARD_ACCOUNT_URL, DASHBOARD_PROJECTS_URL } from 'common/constants/dashboard-urls'
import { Database, LogOut, Menu, Settings, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  singleThemes,
} from 'ui'

export interface TopNavDropdownProps {
  children: ReactNode
  className?: string
}

export interface TopNavThemeGroupProps {
  value: string | undefined
  onValueChange: (value: string) => void
}

export interface TopNavAccountItemsProps {
  email: string | undefined
}

export interface TopNavSignOutItemProps {
  onSelect: () => void
}

interface TriggerIconProps {
  user: User | null
}

export const TopNavDropdown = ({ children, className }: TopNavDropdownProps) => {
  const user = useUser()
  const isUserLoading = useIsUserLoading()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'size-7.5 min-w-7.5 space-x-0 border-default bg-transparent px-0 text-foreground-light',
            'hover:border-strong hover:bg-overlay-hover/50! data-open:border-stronger data-open:bg-overlay-hover/30',
            user ? 'overflow-hidden rounded-full' : null,
            isUserLoading
              ? 'in-data-signed-in:overflow-hidden in-data-signed-in:rounded-full'
              : null,
            className
          )}
        >
          {isUserLoading ? <LoadingTriggerIcon /> : <TriggerIcon user={user} />}
          <span className="sr-only">Open menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TopNavThemeGroup = ({ value, onValueChange }: TopNavThemeGroupProps) => (
  <DropdownMenuGroup>
    <DropdownMenuLabel>Theme</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
      {singleThemes.map((theme) => (
        <DropdownMenuRadioItem key={theme.value} value={theme.value}>
          {theme.name}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuGroup>
)

export const TopNavAccountItems = ({ email }: TopNavAccountItemsProps) => (
  <>
    <DropdownMenuLabel className="flex items-center gap-2 font-normal">
      <UserIcon aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
      <span className="truncate">{email || "You're signed in"}</span>
    </DropdownMenuLabel>
    <DropdownMenuItem asChild className="gap-2">
      <a href={DASHBOARD_ACCOUNT_URL}>
        <Settings aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
        Account Preferences
      </a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild className="gap-2">
      <a href={DASHBOARD_PROJECTS_URL}>
        <Database aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
        All Projects
      </a>
    </DropdownMenuItem>
  </>
)

export const TopNavSignOutItem = ({ onSelect }: TopNavSignOutItemProps) => (
  <DropdownMenuItem className="gap-2" onSelect={onSelect}>
    <LogOut aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
    Sign out
  </DropdownMenuItem>
)

// auth loads after hydration, so the first-paint hint in common/gotrue picks the icon until then
const LoadingTriggerIcon = () => (
  <>
    <Menu aria-hidden className="size-4.5 in-data-signed-in:hidden" strokeWidth={1} />
    <UserIcon aria-hidden className="hidden size-4 in-data-signed-in:block" strokeWidth={1.5} />
    <span
      aria-hidden
      className="absolute inset-0 hidden bg-(image:--signed-in-avatar) bg-cover bg-center in-data-signed-in:block"
    />
  </>
)

const TriggerIcon = ({ user }: TriggerIconProps) => {
  const avatarUrl: unknown = user?.user_metadata?.avatar_url

  if (!user) return <Menu aria-hidden className="size-4.5" strokeWidth={1} />
  if (typeof avatarUrl !== 'string' || avatarUrl === '') {
    return <UserIcon aria-hidden className="size-4" strokeWidth={1.5} />
  }
  // a failed background paints nothing, so the person icon stays visible. a failed img draws a broken icon
  return (
    <>
      <UserIcon aria-hidden className="size-4" strokeWidth={1.5} />
      <span
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }}
      />
    </>
  )
}
