import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'

import { NextPageWithLayout } from 'types'
import { useParams, useStore } from 'hooks'
import Loading from 'components/ui/Loading'
import { OrganizationLayout } from 'components/layouts'
import { GeneralSettings } from 'components/interfaces/Organization'

const OrgGeneralSettings: NextPageWithLayout = () => {
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
                activeId="general"
                onChange={(id: any) => {
                  if (id !== 'general') router.push(`/org/${slug}/${id}`)
                }}
              >
                <Tabs.Panel id="general" label="General" />
                <Tabs.Panel id="team" label="Team" />
                <Tabs.Panel id="billing" label="Billing" />
                <Tabs.Panel id="invoices" label="Invoices" />
              </Tabs>
            </nav>
          </div>

          <div className="mb-8">
            <GeneralSettings />
          </div>
        </div>
      )}
    </>
  )
}

OrgGeneralSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
export default observer(OrgGeneralSettings)
