import { useParams } from 'common'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { Tabs } from 'ui'
import { AccountLayout } from './'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldHeader, ScaffoldTitle } from './Scaffold'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = useParams()
  const id = router.asPath.split('/').at(-1)

  return (
    <AccountLayout
      title={ui.selectedOrganization?.name ?? 'Supabase'}
      breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
    >
      <ScaffoldHeader>
        <ScaffoldContainer>
          <ScaffoldTitle>{ui.selectedOrganization?.name ?? 'Organization'} settings</ScaffoldTitle>
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
              <Tabs.Panel id="invoices" label="Invoices" className="!my-0" />
            </Tabs>
          </nav>
        </ScaffoldContainer>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {children}
    </AccountLayout>
  )
}

export default observer(OrganizationLayout)
