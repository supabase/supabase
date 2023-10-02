import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useTheme } from 'next-themes'
import { useFlag } from 'hooks'
import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'
import {
  DropdownMenuContent_Shadcn_,
  DropdownMenuGroup_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuLabel_Shadcn_,
  DropdownMenuRadioGroup_Shadcn_,
  DropdownMenuRadioItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuShortcut_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconUser,
  useCommandMenu,
} from 'ui'

const UserSettingsDropdown = () => {
  const signOut = useSignOut()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { profile } = useProfile()
  const showAuditLogs = useFlag('auditLogs')
  const { setIsOpen: setCommandMenuOpen } = useCommandMenu()
  const { theme, setTheme } = useTheme()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
      <DropdownMenuTrigger_Shadcn_ asChild>
        <button
          id="user-settings-dropdown"
          className="flex items-center justify-center border font-bold rounded-full h-7 w-7 text-foreground-light bg-surface-100"
        >
          {profile?.first_name ? profile?.first_name?.[0] : <IconUser size={14} strokeWidth={2} />}
        </button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ align="end" className="w-60">
        <DropdownMenuGroup_Shadcn_>
          <div key="profile" className="px-2 py-1.5">
            <p className="text-sm text-foreground">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-foreground-light truncate">{profile?.primary_email}</p>
          </div>

          <DropdownMenuSeparator_Shadcn_ />
          <Link passHref href="/account/me">
            <DropdownMenuItem_Shadcn_
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              asChild
            >
              <a>Preferences</a>
            </DropdownMenuItem_Shadcn_>
          </Link>
          <Link passHref href="/account/tokens">
            <DropdownMenuItem_Shadcn_
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              asChild
            >
              <a>Access tokens</a>
            </DropdownMenuItem_Shadcn_>
          </Link>
          {showAuditLogs ? (
            <Link passHref href="/account/audit">
              <DropdownMenuItem_Shadcn_
                className="cursor-pointer"
                onClick={() => setOpen(false)}
                asChild
              >
                <a>Audit logs</a>
              </DropdownMenuItem_Shadcn_>
            </Link>
          ) : null}
          <DropdownMenuSeparator_Shadcn_ />
          <DropdownMenuItem_Shadcn_
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false)
              setCommandMenuOpen(true)
            }}
          >
            <span>Command menu</span>
            <DropdownMenuShortcut_Shadcn_>⌘K</DropdownMenuShortcut_Shadcn_>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuSeparator_Shadcn_ />
          <DropdownMenuLabel_Shadcn_>Theme</DropdownMenuLabel_Shadcn_>
          <DropdownMenuRadioGroup_Shadcn_
            value={theme}
            onValueChange={(x) => {
              setTheme(x)
            }}
          >
            <DropdownMenuRadioItem_Shadcn_ value={'system'}>System</DropdownMenuRadioItem_Shadcn_>
            <DropdownMenuRadioItem_Shadcn_ value={'dark'}>Dark</DropdownMenuRadioItem_Shadcn_>
            <DropdownMenuRadioItem_Shadcn_ value={'light'}>Light</DropdownMenuRadioItem_Shadcn_>
          </DropdownMenuRadioGroup_Shadcn_>

          <DropdownMenuSeparator_Shadcn_ />
          <DropdownMenuItem_Shadcn_
            className="cursor-pointer"
            onClick={() => {
              onClickLogout()
              setOpen(false)
            }}
          >
            <span>Log out</span>
          </DropdownMenuItem_Shadcn_>
        </DropdownMenuGroup_Shadcn_>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}

export default UserSettingsDropdown
