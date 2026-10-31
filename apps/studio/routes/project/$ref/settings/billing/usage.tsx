import { createFileRoute } from '@tanstack/react-router'

import ProjectBillingUsage from '@/pages/project/[ref]/settings/billing/usage'

export const Route = createFileRoute('/project/$ref/settings/billing/usage')({
  component: SettingsBillingUsageRoute,
  staticData: { settingsLayoutTitle: 'Usage' },
})

function SettingsBillingUsageRoute() {
  return <ProjectBillingUsage dehydratedState={undefined} />
}
