import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useFlag, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import { NavMenu, NavMenuItem } from 'ui'
import { AccountLayout } from './'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'
import SettingsLayout from './SettingsLayout/SettingsLayout'
import Link from 'next/link'
import { useOrgSubscriptionQuery } from '../../data/subscriptions/org-subscription-query'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const router = useRouter()
  const { slug } = useParams()

  const invoicesEnabledOnProfileLevel = useIsFeatureEnabled('billing:invoices')
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  const isNotOrgWithPartnerBilling = !subscription?.billing_via_partner ?? true
  const invoicesEnabled = invoicesEnabledOnProfileLevel && isNotOrgWithPartnerBilling

  const navLayoutV2 = useFlag('navigationLayoutV2')

  if (navLayoutV2) {
    return <SettingsLayout>{children}</SettingsLayout>
  }

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
              <NavMenuItem key={item.label} active={item.href === router.asPath}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </ScaffoldContainer>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {children}
    </AccountLayout>
  )
}

export default OrganizationLayout
