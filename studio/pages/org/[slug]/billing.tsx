import { useRouter } from 'next/router'

import { useParams } from 'common/hooks'
import { BillingSettings, BillingSettingsV2 } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { Tabs } from 'ui'

const OrgBillingSettings: NextPageWithLayout = () => {
  const { slug } = useParams()
  const router = useRouter()

  const selectedOrganization = useSelectedOrganization()
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()

  const showOAuthApps = useFlag('oauthApps')
  const isOrgBilling = !!selectedOrganization?.subscription_id

  return (
    <>
      {selectedOrganization === undefined && isLoadingPermissions ? (
        <Loading />
      ) : (
        <div>
          <div className="space-y-3.5">
            <section className="mt-4 px-4">
              <h1 className="text-3xl">{selectedOrganization?.name ?? 'Organization'} settings</h1>
            </section>
            <nav>
              <Tabs
                size="small"
                type="underlined"
                activeId="billing"
                onChange={(id: any) => {
                  if (id !== 'billing') router.push(`/org/${slug}/${id}`)
                }}
              >
                <Tabs.Panel id="general" label="General" />
                <Tabs.Panel id="team" label="Team" />
                <Tabs.Panel id="billing" label="Billing" className="!m-0" />
                {isOrgBilling && <Tabs.Panel id="usage" label="Usage" />}
                <Tabs.Panel id="invoices" label="Invoices" />
                {showOAuthApps && <Tabs.Panel id="apps" label="OAuth Apps" />}
              </Tabs>
            </nav>
          </div>

          <div className="mb-8">
            {isOrgBilling ? (
              <BillingSettingsV2 />
            ) : (
              <div className="px-4">
                <BillingSettings />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

OrgBillingSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgBillingSettings
