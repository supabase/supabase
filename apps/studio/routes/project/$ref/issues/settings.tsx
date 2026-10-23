import { createFileRoute } from '@tanstack/react-router'

import IssueSettingsPage from '@/pages/project/[ref]/issues/settings'

export const Route = createFileRoute('/project/$ref/issues/settings')({
  component: IssueSettingsRoute,
})

function IssueSettingsRoute() {
  return <IssueSettingsPage dehydratedState={undefined} />
}
