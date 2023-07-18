import Link from 'next/link'
import { useRouter } from 'next/router'
import { Dropdown, IconLogOut, Listbox, useCommandMenu } from 'ui'

import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'
import { useTheme } from 'common'
import KeyMap from 'components/to-be-cleaned/KeyMap'

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
    <Dropdown
      align="end"
      side="bottom"
      overlay={[
        <div key="profile" className="px-4 py-1.5">
          <p className="text-sm text-scale-1200">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-scale-1000">{profile?.primary_email}</p>
        </div>,
        <Dropdown.Separator key="sep-1" />,
        <Link key="preferences" href="/account/me">
          <a>
            <Dropdown.Item>Preferences</Dropdown.Item>
          </a>
        </Link>,
        <Link key="access-tokens" href="/account/tokens">
          <a>
            <Dropdown.Item>Access tokens</Dropdown.Item>
          </a>
        </Link>,
        <Dropdown.Separator key="sep-2" />,
        <Dropdown.Item key="cmdk" className="w-full" onClick={() => setIsOpen(true)}>
          <div className="flex items-center justify-between">
            <p>Quick search</p>
            <div className="border rounded bg-scale-200 px-2 py-0.5 text-xs">
              <KeyMap keyMap="command+K" />
            </div>
          </div>
        </Dropdown.Item>,
        // <Dropdown.Item key="theme-selector">
        //   <div className="flex items-center justify-between">
        //     <p>Theme</p>
        //     <Listbox
        //       size="tiny"
        //       value={isDarkMode ? 'dark' : 'light'}
        //       onChange={(e: any) => toggleTheme(e === 'dark')}
        //       // className="w-[200px]"
        //     >
        //       <Listbox.Option label="Dark" value="dark">
        //         Dark
        //       </Listbox.Option>
        //       <Listbox.Option label="Light" value="light">
        //         Light
        //       </Listbox.Option>
        //     </Listbox>
        //   </div>
        // </Dropdown.Item>,
        <Dropdown.Separator key="sep-3" />,
        <Dropdown.Label key="theme-label">Theme</Dropdown.Label>,
        <Dropdown.RadioGroup
          key="theme"
          value={isDarkMode ? 'dark' : 'light'}
          onChange={(e: any) => toggleTheme(e === 'dark')}
        >
          {/* [Joshen] Removing system default for now, needs to be supported in useTheme from common packages */}
          {/* <Dropdown.Radio value="system">System default</Dropdown.Radio> */}
          <Dropdown.Radio value="dark">Dark</Dropdown.Radio>
          <Dropdown.Radio value="light">Light</Dropdown.Radio>
        </Dropdown.RadioGroup>,
        <Dropdown.Separator key="sep-4" />,
        <Dropdown.Item key="log out" onClick={() => onClickLogout()}>
          <div className="flex items-center justify-between">
            <p>Logout</p>
            <IconLogOut size={14} strokeWidth={1.5} />
          </div>
        </Dropdown.Item>,
      ]}
    >
      <div className="flex items-center justify-center border rounded-full h-7 w-7 text-scale-1100">
        {profile?.first_name[0]}
      </div>
    </Dropdown>
  )
}

export default UserSettingsDropdown
