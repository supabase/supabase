import Link from 'next/link'
import { useRouter } from 'next/router'
import { Dropdown, IconLogOut } from 'ui'

import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'

const UserSettingsDropdown = () => {
  const signOut = useSignOut()
  const router = useRouter()
  const { profile } = useProfile()

  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

  return (
    <Dropdown
      align="end"
      side="bottom"
      overlay={[
        <Link key="preferences" href="/">
          <a>
            <Dropdown.Item>Preferences</Dropdown.Item>
          </a>
        </Link>,
        <Link key="access-tokens" href="/">
          <a>
            <Dropdown.Item>Access tokens</Dropdown.Item>
          </a>
        </Link>,
        <Dropdown.Separator key="sep-1" />,
        <Dropdown.Item
          key="log out"
          icon={<IconLogOut size={14} strokeWidth={1.5} />}
          onClick={() => onClickLogout()}
        >
          Logout
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
