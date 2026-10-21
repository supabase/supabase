import { createFileRoute } from '@tanstack/react-router'

import { ModelDashboard } from '@/components/interfaces/Model/ModelDashboard'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'

export const Route = createFileRoute('/project/$ref/model')({
  component: ModelRoute,
})

function ModelRoute() {
  return (
    <ProjectLayoutWithAuth>
      <ModelDashboard />
    </ProjectLayoutWithAuth>
  )
}
