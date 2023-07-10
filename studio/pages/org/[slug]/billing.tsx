import { useParams } from 'common'
import { BillingSettings, BillingSettingsV2 } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { useEffect } from 'react'
import {
  ORG_SETTINGS_PANEL_KEYS,
  useOrgSettingsPageStateSnapshot,
} from 'state/organization-settings'
import { NextPageWithLayout } from 'types'

const OrgBillingSettings: NextPageWithLayout = () => {
  const { panel } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()
  const isOrgBilling = !!selectedOrganization?.subscription_id

  useEffect(() => {
    const allowedValues = ['subscriptionPlan', 'costControl']
    if (panel && typeof panel === 'string' && allowedValues.includes(panel)) {
      snap.setPanelKey(panel as ORG_SETTINGS_PANEL_KEYS)
      document.getElementById('billing-page-top')?.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel])

  return (
    <>
      {selectedOrganization === undefined && isLoadingPermissions ? (
        <Loading />
      ) : (
        <>
          {isOrgBilling ? (
            <BillingSettingsV2 />
          ) : (
            <div className="px-4">
              <BillingSettings />
            </div>
          )}
        </>
      )}
    </>
  )
}

OrgBillingSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
export default OrgBillingSettings
