import { useEffect } from 'react'

import { useParams } from 'common'
import { BillingSettings } from 'components/interfaces/Organization/BillingSettings/BillingSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import {
  ORG_SETTINGS_PANEL_KEYS,
  useOrgSettingsPageStateSnapshot,
} from 'state/organization-settings'
import type { NextPageWithLayout } from 'types'

const OrgBillingSettings: NextPageWithLayout = () => {
  const { panel } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()

  useEffect(() => {
    const allowedValues = ['subscriptionPlan', 'costControl']
    if (panel && typeof panel === 'string' && allowedValues.includes(panel)) {
      snap.setPanelKey(panel as ORG_SETTINGS_PANEL_KEYS)
      document.getElementById('billing-page-top')?.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel])

  return <BillingSettings />
}

OrgBillingSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgBillingSettings
