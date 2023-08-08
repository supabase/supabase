import { useTheme } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
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

import { useSignOut } from 'lib/auth'
import { detectOS } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useFlag } from 'hooks'
import { useAppUiStateSnapshot } from 'state/app'

const UserSettingsDropdown = () => {
  const os = detectOS()
  const router = useRouter()
  const signOut = useSignOut()
  const { profile } = useProfile()
  const snap = useAppUiStateSnapshot()
  const [open, setOpen] = useState(false)
  const { isDarkMode, toggleTheme } = useTheme()
  const { setIsOpen: setCommandMenuOpen } = useCommandMenu()
  const navLayoutV2 = useFlag('navigationLayoutV2')

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
      <DropdownMenuTrigger_Shadcn_ asChild>
        <button
          id="user-settings-dropdown"
          className="flex items-center justify-center border font-bold rounded-full h-7 w-7 text-scale-1100 bg-surface-100"
        >
          {profile?.first_name ? profile?.first_name?.[0] : <IconUser size={14} strokeWidth={2} />}
        </button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ align="end" className="w-60">
        <DropdownMenuGroup_Shadcn_>
          <div key="profile" className="px-2 py-1.5">
            <p className="text-sm text-scale-1200">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-scale-1000 truncate">{profile?.primary_email}</p>
          </div>

          <DropdownMenuSeparator_Shadcn_ />

          <Link passHref href="/account/me">
            <DropdownMenuItem_Shadcn_
              className="cursor-pointer"
              onSelect={() => {
                router.push('/account/me')
              }}
              onClick={() => setOpen(false)}
              asChild
            >
              <a>Preferences</a>
            </DropdownMenuItem_Shadcn_>
          </Link>

          <Link passHref href="/account/tokens">
            <DropdownMenuItem_Shadcn_
              className="cursor-pointer"
              onSelect={() => {
                router.push('/account/tokens')
              }}
              onClick={() => setOpen(false)}
              asChild
            >
              <a>Access tokens</a>
            </DropdownMenuItem_Shadcn_>
          </Link>

          <DropdownMenuSeparator_Shadcn_ />

          <DropdownMenuItem_Shadcn_
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false)
              setCommandMenuOpen(true)
            }}
          >
            <span>Command menu</span>
            <DropdownMenuShortcut_Shadcn_>
              {os === 'macos' ? '⌘' : 'CTRL '}K
            </DropdownMenuShortcut_Shadcn_>
          </DropdownMenuItem_Shadcn_>

          {navLayoutV2 && (
            <>
              <DropdownMenuSeparator_Shadcn_ />
              <DropdownMenuItem_Shadcn_
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false)
                  snap.setShowFeaturePreviewModal(true)
                }}
              >
                <span>Feature preview</span>
              </DropdownMenuItem_Shadcn_>
            </>
          )}

          <DropdownMenuSeparator_Shadcn_ />

          <DropdownMenuLabel_Shadcn_>Theme</DropdownMenuLabel_Shadcn_>

          <DropdownMenuRadioGroup_Shadcn_
            value={isDarkMode ? 'dark' : 'light'}
            onValueChange={(x) => {
              const dark = x === 'dark'
              toggleTheme(Boolean(dark))
            }}
          >
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
