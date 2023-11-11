import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useFlag, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import { Tabs } from 'ui'
import { AccountLayout } from './'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'
import SettingsLayout from './SettingsLayout/SettingsLayout'

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
          <nav>
            <Tabs
              listClassNames="border-none"
              size="small"
              type="underlined"
              activeId={id}
              onChange={(id: any) => {
                router.push(`/org/${slug}/${id}`)
              }}
            >
              <Tabs.Panel id="general" label="General" className="!my-0" />
              <Tabs.Panel id="team" label="Team" className="!my-0" />

              <Tabs.Panel id="integrations" label="Integrations" className="!my-0" />

              <Tabs.Panel id="billing" label="Billing" className="!my-0" />
              <Tabs.Panel id="usage" label="Usage" className="!my-0" />
              {invoicesEnabled && <Tabs.Panel id="invoices" label="Invoices" className="!my-0" />}
              <Tabs.Panel id="apps" label="OAuth Apps" className="!my-0" />
              <Tabs.Panel id="audit" label="Audit Logs" className="!my-0" />

              <Tabs.Panel id="documents" label="Legal Documents" className="!my-0" />
            </Tabs>
          </nav>
        </ScaffoldContainer>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {children}
    </AccountLayout>
  )
}

export default OrganizationLayout
