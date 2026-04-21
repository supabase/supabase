import { createFileRoute } from '@tanstack/react-router'

import OrgIntegrationSettingsPage from '@/pages/org/[slug]/integrations'

export const Route = createFileRoute('/_app/org/$slug/integrations')({
  component: OrgIntegrations,
  staticData: {
    orgLayoutTitle: 'Integrations',
  },
})

function OrgIntegrations() {
  return <OrgIntegrationSettingsPage dehydratedState={undefined} />
}
