import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  DropdownMenuCheckboxItem_Shadcn_,
  DropdownMenuContent_Shadcn_,
  DropdownMenuGroup_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuLabel_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuShortcut_Shadcn_,
  DropdownMenuSubContent_Shadcn_,
  DropdownMenuSubTrigger_Shadcn_,
  DropdownMenuSub_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconCheck,
  IconUser,
  useCommandMenu,
} from 'ui'

import { useTheme } from 'common'
import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'

const UserSettingsDropdown = () => {
  const signOut = useSignOut()
  const router = useRouter()
  const { profile } = useProfile()
  const { setIsOpen } = useCommandMenu()
  const { isDarkMode, toggleTheme } = useTheme()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
        <div className="flex items-center justify-center border rounded-full h-7 w-7 text-scale-1100">
          {profile?.first_name ? profile?.first_name?.[0] : <IconUser size={14} strokeWidth={2} />}
        </div>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ align="end" className="w-60">
        <DropdownMenuGroup_Shadcn_>
          <div key="profile" className="px-2 py-1.5">
            <p className="text-sm text-scale-1200">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-scale-1000 truncate">{profile?.primary_email}</p>
          </div>

          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_ onSelect={() => router.push('/account/me')}>
            <Link passHref href="/account/me">
              <a className="w-full">Preferences</a>
            </Link>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuItem_Shadcn_ onSelect={() => router.push('/account/tokens')}>
            <Link passHref href="/account/tokens">
              <a className="w-full">Access tokens</a>
            </Link>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_ className="cursor-pointer" onClick={() => setIsOpen(true)}>
            <span>Command menu</span>
            <DropdownMenuShortcut_Shadcn_>⌘K</DropdownMenuShortcut_Shadcn_>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />

          <DropdownMenuLabel_Shadcn_>Theme</DropdownMenuLabel_Shadcn_>
          <DropdownMenuCheckboxItem_Shadcn_
            checked={isDarkMode}
            onCheckedChange={() => toggleTheme(true)}
          >
            Dark
          </DropdownMenuCheckboxItem_Shadcn_>
          <DropdownMenuCheckboxItem_Shadcn_
            checked={!isDarkMode}
            onCheckedChange={() => toggleTheme(false)}
          >
            Light
          </DropdownMenuCheckboxItem_Shadcn_>

          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_ className="cursor-pointer" onClick={() => onClickLogout()}>
            <span>Log out</span>
          </DropdownMenuItem_Shadcn_>
        </DropdownMenuGroup_Shadcn_>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}

export default UserSettingsDropdown
