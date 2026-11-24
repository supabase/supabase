'use client'

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

export const TopNavDropdown = ({ children, className }: TopNavDropdownProps) => (
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'size-7.5 min-w-7.5 space-x-0 border-default bg-transparent px-0 text-foreground-light',
          'hover:border-strong hover:bg-overlay-hover/50! data-open:border-stronger data-open:bg-overlay-hover/30',
          className
        )}
      >
        <Menu aria-hidden className="size-4.5" strokeWidth={1} />
        <span className="sr-only">Open menu</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="bottom" align="end" className="w-52">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
)

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
