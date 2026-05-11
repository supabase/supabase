import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'

export const Route = createFileRoute('/project/$ref/integrations')({
  component: IntegrationsShell,
})

function IntegrationsShell() {
  return (
    <ProjectIntegrationsLayout>
      <Outlet />
    </ProjectIntegrationsLayout>
  )
}
