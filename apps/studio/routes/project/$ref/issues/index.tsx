import { createFileRoute } from '@tanstack/react-router'

import { IssuesOverview } from '@/components/interfaces/Issues/IssuesOverview'

export const Route = createFileRoute('/project/$ref/issues/')({
  component: IssuesPage,
})

function IssuesPage() {
  return <IssuesOverview />
}
