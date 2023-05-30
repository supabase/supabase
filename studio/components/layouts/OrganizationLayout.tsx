import { useParams } from 'common'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { Tabs } from 'ui'
import { AccountLayout } from './'

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
      <div className="p-4 pt-0">
        <div className="space-y-3">
          <section className="mt-4">
            <h1 className="text-3xl">{ui.selectedOrganization?.name ?? 'Organization'} settings</h1>
          </section>
          <nav>
            <Tabs
              size="small"
              type="underlined"
              activeId={id}
              onChange={(id: any) => {
                router.push(`/org/${slug}/${id}`)
              }}
            >
              <Tabs.Panel id="general" label="General" />
              <Tabs.Panel id="team" label="Team" />
              <Tabs.Panel id="integrations" label="Integrations" />
              <Tabs.Panel id="billing" label="Billing" />
              <Tabs.Panel id="invoices" label="Invoices" />
            </Tabs>
          </nav>
        </div>

        <div className="mb-8">{children}</div>
      </div>
    </AccountLayout>
  )
}

export default observer(OrganizationLayout)
