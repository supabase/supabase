import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'

import { NextPageWithLayout } from 'types'
import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import Loading from 'components/ui/Loading'
import { OrganizationLayout } from 'components/layouts'
import { OAuthApps } from 'components/interfaces/Organization'

const OrgOAuthApps: NextPageWithLayout = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const router = useRouter()

  return (
    <>
      {ui.selectedOrganization === undefined && (ui?.permissions ?? []).length === 0 ? (
        <Loading />
      ) : (
        <div className="p-4 pt-0">
          <div className="space-y-3">
            <section className="mt-4">
              <h1 className="text-3xl">
                {ui.selectedOrganization?.name ?? 'Organization'} settings
              </h1>
            </section>
            <nav>
              <Tabs
                size="small"
                type="underlined"
                activeId="apps"
                onChange={(id: any) => {
                  if (id !== 'apps') router.push(`/org/${slug}/${id}`)
                }}
              >
                <Tabs.Panel id="general" label="General" />
                <Tabs.Panel id="team" label="Team" />
                <Tabs.Panel id="billing" label="Billing" />
                <Tabs.Panel id="invoices" label="Invoices" />
                <Tabs.Panel id="apps" label="OAuth Apps" />
              </Tabs>
            </nav>
          </div>

          <div className="mb-8">
            <OAuthApps />
          </div>
        </div>
      )}
    </>
  )
}

OrgOAuthApps.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
export default observer(OrgOAuthApps)
