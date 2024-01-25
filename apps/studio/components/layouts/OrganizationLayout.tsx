import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useFlag, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import { NavMenu, NavMenuItem } from 'ui'
import { AccountLayout } from './'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'
import SettingsLayout from './SettingsLayout/SettingsLayout'
import Link from 'next/link'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const router = useRouter()
  const { slug } = useParams()
  const id = router.asPath.split('/').at(-1)?.split('?')[0]?.split('#')[0]

  const invoicesEnabled = useIsFeatureEnabled('billing:invoices')

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
      <ScaffoldHeader>
        <ScaffoldContainer id="billing-page-top">
          <ScaffoldTitle>{selectedOrganization?.name ?? 'Organization'} settings</ScaffoldTitle>
        </ScaffoldContainer>
        <ScaffoldContainer>
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
