import { User } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'
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
  singleThemes,
  Theme,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

const UserSettingsDropdown = () => {
  const signOut = useSignOut()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { profile } = useProfile()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const { theme, setTheme } = useTheme()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <DropdownMenu open={open} onOpenChange={() => setOpen(!open)} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          id="user-settings-dropdown"
          className="flex items-center justify-center border font-bold rounded-full h-7 w-7 text-foreground-light bg-surface-100"
        >
          {profile?.first_name ? profile?.first_name?.[0] : <User size={14} strokeWidth={2} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <div key="profile" className="px-2 py-1.5">
            <p className="text-sm text-foreground">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-foreground-light truncate">{profile?.primary_email}</p>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpen(false)} asChild>
            <Link href="/account/me">Preferences</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpen(false)} asChild>
            <Link href="/account/tokens">Access tokens</Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpen(false)} asChild>
            <Link href="/account/audit">Audit logs</Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false)
              setCommandMenuOpen(true)
            }}
          >
            <span>Command menu</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(x) => {
              setTheme(x)
            }}
          >
            {singleThemes.map((theme: Theme) => (
              <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              onClickLogout()
              setOpen(false)
            }}
          >
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserSettingsDropdown
