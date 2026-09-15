import { createFileRoute } from '@tanstack/react-router'

import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import HomePage from '@/pages/project/[ref]/index'

export const Route = createFileRoute('/project/$ref/')({
  component: ProjectHomeRoute,
})

function ProjectHomeRoute() {
  return (
    <ProjectLayoutWithAuth>
      <HomePage dehydratedState={undefined} />
    </ProjectLayoutWithAuth>
  )
}
