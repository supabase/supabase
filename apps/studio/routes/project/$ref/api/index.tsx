import { createFileRoute } from '@tanstack/react-router'

import ApiDocsRedirect from '@/pages/project/[ref]/api/index'

export const Route = createFileRoute('/project/$ref/api/')({
  component: ProjectApiIndexRoute,
})

function ProjectApiIndexRoute() {
  return <ApiDocsRedirect dehydratedState={undefined} />
}
