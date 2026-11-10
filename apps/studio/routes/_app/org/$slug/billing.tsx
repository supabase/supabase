import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import { BillingSettings } from '@/components/interfaces/Organization/BillingSettings/BillingSettings'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import {
  ORG_SETTINGS_PANEL_KEYS,
  useOrgSettingsPageStateSnapshot,
} from '@/state/organization-settings'

export const Route = createFileRoute('/_app/org/$slug/billing')({
  component: OrgBillingSettingsPage,
  staticData: {
    orgLayoutTitle: 'Billing',
  },
})

function OrgBillingSettingsPage() {
  const { panel, slug } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()

  const showBilling = useIsFeatureEnabled('billing:all')

  useEffect(() => {
    const allowedValues = ['subscriptionPlan', 'costControl']
    if (panel && typeof panel === 'string' && allowedValues.includes(panel)) {
      snap.setPanelKey(panel as ORG_SETTINGS_PANEL_KEYS)
      document.getElementById('billing-page-top')?.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel])

  if (!showBilling) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return <BillingSettings />
}
