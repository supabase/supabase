import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import { BillingSettings } from '@/components/interfaces/Organization/BillingSettings/BillingSettings'
import { useOrgSettingsPanel } from '@/components/interfaces/Organization/BillingSettings/useOrgSettingsPanel'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/_app/org/$slug/billing')({
  component: OrgBillingSettingsPage,
  staticData: {
    orgLayoutTitle: 'Billing',
  },
})

function OrgBillingSettingsPage() {
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
