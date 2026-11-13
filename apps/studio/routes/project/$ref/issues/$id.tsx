import { createFileRoute } from '@tanstack/react-router'

import IssuePage from '@/pages/project/[ref]/issues/[id]'

export const Route = createFileRoute('/project/$ref/issues/$id')({
  component: IssueRoute,
})

function IssueRoute() {
  return <IssuePage dehydratedState={undefined} />
}
