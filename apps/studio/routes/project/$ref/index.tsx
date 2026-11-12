import { createFileRoute } from '@tanstack/react-router'

import { ProjectHome } from '@/components/interfaces/ProjectHome/Home'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'

export const Route = createFileRoute('/project/$ref/')({
  component: ProjectHomeRoute,
})

function ProjectHomeRoute() {
  return (
    <ProjectLayoutWithAuth>
      <ProjectHome />
    </ProjectLayoutWithAuth>
  )
}
