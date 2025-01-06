import { useRouter } from 'next/router'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import SettingsMenuItem from './SettingsMenuItem'

const OrganizationSettingsMenu = () => {
  const router = useRouter()
  const organization = useSelectedOrganization()
  const organizationSettings = [
    { label: 'General', pathname: `/org/[slug]/general` },
    { label: 'Members', pathname: `/org/[slug]/team` },
    { label: 'Integrations', pathname: `/org/[slug]/integrations` },
    { label: 'Billing', pathname: `/org/[slug]/billing` },
    { label: 'Usage', pathname: `/org/[slug]/usage` },
    { label: 'Invoices', pathname: `/org/[slug]/invoices` },
    { label: 'OAuth Apps', pathname: `/org/[slug]/apps` },
    { label: 'Audit Logs', pathname: `/org/[slug]/audit` },
    { label: 'Legal Documents', pathname: `/org/[slug]/documents` },
  ]

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-medium">Organization</p>
        {organizationSettings.map((link) => (
          <SettingsMenuItem
            key={link.label}
            label={link.label}
            href={
              organization !== undefined ? link.pathname.replace('[slug]', organization.slug) : '/'
            }
            isActive={link.pathname === router.pathname}
          />
        ))}
      </div>
    </div>
  )
}

export default OrganizationSettingsMenu
