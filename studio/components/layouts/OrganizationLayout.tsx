import { useParams } from 'common'
import { useFlag, useSelectedOrganization } from 'hooks'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { Tabs } from 'ui'
import { AccountLayout } from './'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const router = useRouter()
  const { slug } = useParams()
  const id = router.asPath.split('/').at(-1)?.split('?')[0]?.split('#')[0]
  const showOAuthApps = useFlag('oauthApps')
  const showAuditLogs = useFlag('auditLogs')
  const showIntegrationsV2 = useFlag('integrationsV2')
  const isOrgBilling = !!selectedOrganization?.subscription_id

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
              {showIntegrationsV2 && (
                <Tabs.Panel id="integrations" label="Integrations" className="!my-0" />
              )}
              <Tabs.Panel id="billing" label="Billing" className="!my-0" />
              {isOrgBilling && <Tabs.Panel id="usage" label="Usage" className="!my-0" />}
              <Tabs.Panel id="invoices" label="Invoices" className="!my-0" />
              {showOAuthApps && <Tabs.Panel id="apps" label="OAuth Apps" className="!my-0" />}
              {showAuditLogs && <Tabs.Panel id="audit" label="Audit Logs" className="!my-0" />}
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
