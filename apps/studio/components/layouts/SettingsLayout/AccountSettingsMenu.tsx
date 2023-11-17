import { compact } from 'lodash'
import { useRouter } from 'next/router'
import SettingsMenuItem from './SettingsMenuItem'

const AccountSettingsMenu = () => {
  const router = useRouter()
  const accountSettings = compact([
    { label: 'Preferences', pathname: `/account/me` },
    { label: 'Access Tokens', pathname: `/account/tokens` },
    { label: 'Security', pathname: `/account/security` },
    { label: 'Audit logs', pathname: `/account/audit` },
  ])

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-medium">Account Settings</p>
        {accountSettings.map((link) => (
          <SettingsMenuItem
            key={link.label}
            label={link.label}
            href={link.pathname}
            isActive={link.pathname === router.pathname}
          />
        ))}
      </div>
    </div>
  )
}

export default AccountSettingsMenu
