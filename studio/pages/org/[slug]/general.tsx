import { useRouter } from 'next/router'

import { useParams } from 'common/hooks'
import { GeneralSettings } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { Tabs } from 'ui'

const OrgGeneralSettings: NextPageWithLayout = () => {
  const { data: permissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()
  const { slug } = useParams()
  const router = useRouter()

  return (
    <>
      {selectedOrganization === undefined && (permissions ?? []).length === 0 ? (
        <Loading />
      ) : (
        <div className="p-4 pt-0">
          <div className="space-y-3">
            <section className="mt-4">
              <h1 className="text-3xl">{selectedOrganization?.name ?? 'Organization'} settings</h1>
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

export default OrgGeneralSettings
