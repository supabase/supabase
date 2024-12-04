import type { PropsWithChildren } from 'react'

import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, NavMenu, NavMenuItem } from 'ui'
import AccountLayout from './AccountLayout/AccountLayout'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const currentPath = useCurrentPath()
  const { slug } = useParams()

  const invoicesEnabledOnProfileLevel = useIsFeatureEnabled('billing:invoices')
  const invoicesEnabled = invoicesEnabledOnProfileLevel

  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })

  const navMenuItems = [
    {
      label: 'General',
      href: `/org/${slug}/general`,
    },
    {
      label: 'Team',
      href: `/org/${slug}/team`,
    },
    {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
    },
    {
      label: 'Billing',
      href: `/org/${slug}/billing`,
    },
    {
      label: 'Usage',
      href: `/org/${slug}/usage`,
    },
    {
      label: 'Invoices',
      href: `/org/${slug}/invoices`,
      hidden: !invoicesEnabled,
    },
    {
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
    },
    {
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
    },
    {
      label: 'Legal Documents',
      href: `/org/${slug}/documents`,
    },
  ]

  const filteredNavMenuItems = navMenuItems.filter((item) => !item.hidden)

  return (
    <AccountLayout
      title={selectedOrganization?.name ?? 'Supabase'}
      breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
    >
      <ScaffoldHeader className="pb-0">
        <ScaffoldContainer id="billing-page-top">
          <ScaffoldTitle className="pb-3">
            {selectedOrganization?.name ?? 'Organization'} settings
          </ScaffoldTitle>
          <NavMenu className="border-none" aria-label="Organization menu navigation">
            {filteredNavMenuItems.map((item) => (
              <NavMenuItem key={item.label} active={currentPath === item.href}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </ScaffoldContainer>
      </ScaffoldHeader>

      <ScaffoldDivider />

      {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
        <ScaffoldContainer className="mt-8">
          <Alert_Shadcn_ variant="default" className="flex items-center gap-4">
            <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
            <AlertTitle_Shadcn_ className="flex-1">
              This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
            </AlertTitle_Shadcn_>
            <Button type="default" iconRight={<ExternalLink />} asChild disabled={!isSuccess}>
              <a href={data?.url} target="_blank" rel="noopener noreferrer">
                Manage
              </a>
            </Button>
          </Alert_Shadcn_>
        </ScaffoldContainer>
      )}

      {children}
    </AccountLayout>
  )
}

export default OrganizationLayout
