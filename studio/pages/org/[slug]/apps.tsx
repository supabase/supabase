import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { Tabs } from 'ui'

import { useParams } from 'common/hooks'
import { OAuthApps } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const OrgOAuthApps: NextPageWithLayout = () => {
  const { slug } = useParams()
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()

  return (
    <>
      {selectedOrganization === undefined && isLoadingPermissions ? (
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
