import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'

export const Route = createFileRoute('/project/$ref/integrations')({
  component: IntegrationsShell,
})

function IntegrationsShell() {
  return (
    <ProjectIntegrationsLayoutDispatch>
      <Outlet />
    </ProjectIntegrationsLayoutDispatch>
  )
}
