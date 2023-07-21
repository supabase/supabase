import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  DropdownMenuContent_Shadcn_,
  DropdownMenuGroup_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuShortcut_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconCheck,
  IconMoon,
  IconSun,
  IconUser,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  useCommandMenu,
} from 'ui'

import { useTheme } from 'common'
import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'
import { useState } from 'react'

const UserSettingsDropdown = () => {
  const signOut = useSignOut()
  const router = useRouter()
  const { profile } = useProfile()
  const { setIsOpen } = useCommandMenu()
  const { isDarkMode, toggleTheme } = useTheme()
  const [openTheme, setOpenTheme] = useState(false)

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <DropdownMenu_Shadcn_
      onOpenChange={(open) => {
        if (!open) setOpenTheme(false)
      }}
    >
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
            <p className="text-sm text-scale-1000">{profile?.primary_email}</p>
          </div>

          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_>
            <Link passHref href="/account/me">
              <a className="w-full">Preferences</a>
            </Link>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuItem_Shadcn_>
            <Link passHref href="/account/tokens">
              <a className="w-full">Access tokens</a>
            </Link>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_ className="cursor-pointer" onClick={() => setIsOpen(true)}>
            <span>Quick search</span>
            <DropdownMenuShortcut_Shadcn_>⌘K</DropdownMenuShortcut_Shadcn_>
          </DropdownMenuItem_Shadcn_>
          <DropdownMenuSeparator_Shadcn_ className="bg-scale-500" />
          <DropdownMenuItem_Shadcn_ asChild onClick={(event) => event.preventDefault()}>
            <div className="w-full flex items-center justify-between">
              <p>Theme</p>
              <Popover_Shadcn_ open={openTheme}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    type="outline"
                    className="px-2 justify-start w-[90px]"
                    icon={isDarkMode ? <IconMoon /> : <IconSun />}
                    onClick={() => setOpenTheme(true)}
                  >
                    {isDarkMode ? 'Dark' : 'Light'}
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="p-0 w-[100px]" side="bottom" align="end">
                  <Command_Shadcn_>
                    <CommandList_Shadcn_>
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          value="dark"
                          className="cursor-pointer"
                          onSelect={() => {
                            setOpenTheme(false)
                            toggleTheme(true)
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>Dark</span>
                            {isDarkMode ? (
                              <IconCheck className="text-brand-900" strokeWidth={2} />
                            ) : null}
                          </div>
                        </CommandItem_Shadcn_>
                        <CommandItem_Shadcn_
                          value="light"
                          className="cursor-pointer"
                          onSelect={() => {
                            setOpenTheme(false)
                            toggleTheme(false)
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>Light</span>
                            {!isDarkMode ? (
                              <IconCheck className="text-brand-900" strokeWidth={2} />
                            ) : null}
                          </div>
                        </CommandItem_Shadcn_>
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </div>
          </DropdownMenuItem_Shadcn_>
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
