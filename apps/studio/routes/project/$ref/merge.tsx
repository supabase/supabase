import { createFileRoute } from '@tanstack/react-router'

import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import MergePage from '@/pages/project/[ref]/merge'

export const Route = createFileRoute('/project/$ref/merge')({
  component: ProjectMergeRoute,
})

function ProjectMergeRoute() {
  return (
    <ProjectLayoutWithAuth>
      <MergePage dehydratedState={undefined} />
    </ProjectLayoutWithAuth>
  )
}
