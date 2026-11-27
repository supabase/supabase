import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ProjectMarketplaceLayout } from '@/components/layouts/ProjectMarketplaceLayout'

export const Route = createFileRoute('/project/$ref/integrations')({
  component: IntegrationsShell,
})

function IntegrationsShell() {
  return (
    <ProjectMarketplaceLayout>
      <Outlet />
    </ProjectMarketplaceLayout>
  )
}
