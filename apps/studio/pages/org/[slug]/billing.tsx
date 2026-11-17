import { useParams } from 'common'
import { useEffect } from 'react'

import { BillingSettings } from '@/components/interfaces/Organization/BillingSettings/BillingSettings'
import { useOrgSettingsPanel } from '@/components/interfaces/Organization/BillingSettings/useOrgSettingsPanel'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const OrgBillingSettings: NextPageWithLayout = () => {
  const { slug } = useParams()
  const { panel } = useOrgSettingsPanel()

  const showBilling = useIsFeatureEnabled('billing:all')

  useEffect(() => {
    if (panel) document.getElementById('billing-page-top')?.scrollIntoView({ behavior: 'smooth' })
  }, [panel])

  if (!showBilling) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return <BillingSettings />
}

OrgBillingSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Billing">{page}</OrganizationLayout>
  </DefaultLayout>
)
export default OrgBillingSettings
