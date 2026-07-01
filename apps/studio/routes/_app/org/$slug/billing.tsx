import { createFileRoute } from '@tanstack/react-router'

import OrgBillingSettingsPage from '@/pages/org/[slug]/billing'

export const Route = createFileRoute('/_app/org/$slug/billing')({
  component: OrgBilling,
  staticData: {
    orgLayoutTitle: 'Billing',
  },
})

function OrgBilling() {
  return <OrgBillingSettingsPage dehydratedState={undefined} />
}
