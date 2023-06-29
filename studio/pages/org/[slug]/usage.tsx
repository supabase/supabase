import { useRouter } from 'next/router'

import { useParams } from 'common/hooks'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { Tabs } from 'ui'

const OrgUsage: NextPageWithLayout = () => {
  const { data: permissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()
  const { slug } = useParams()
  const router = useRouter()
  const showOAuthApps = useFlag('oauthApps')

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
                activeId="usage"
                onChange={(id: any) => {
                  if (id !== 'usage') router.push(`/org/${slug}/${id}`)
                }}
              >
                <Tabs.Panel id="general" label="General" />
                <Tabs.Panel id="team" label="Team" />
                <Tabs.Panel id="billing" label="Billing" />
                <Tabs.Panel id="usage" label="Usage" />
                <Tabs.Panel id="invoices" label="Invoices" />
                {showOAuthApps && <Tabs.Panel id="apps" label="OAuth Apps" />}
              </Tabs>
            </nav>
          </div>

          <div className="mb-8">
            <p>Billing V2</p>
          </div>
        </div>
      )}
    </>
  )
}

OrgUsage.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgUsage
