import { createFileRoute } from '@tanstack/react-router'

import IssuesPage from '@/pages/project/[ref]/issues'

export const Route = createFileRoute('/project/$ref/issues/')({
  component: IssuesRoute,
})

function IssuesRoute() {
  return <IssuesPage dehydratedState={undefined} />
}
