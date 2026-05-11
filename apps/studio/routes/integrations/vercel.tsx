import { createFileRoute, Outlet } from '@tanstack/react-router'

import VercelIntegrationWindowLayout from '@/components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'

export const Route = createFileRoute('/integrations/vercel')({
  component: VercelIntegrationShell,
})

// Placed at top-level rather than under _app — Next getLayout for all
// three leaves only wraps in VercelIntegrationWindowLayout (no AppLayout
// or DefaultLayout), so adding _app's chrome here would be a behaviour
// change.
function VercelIntegrationShell() {
  return (
    <VercelIntegrationWindowLayout>
      <Outlet />
    </VercelIntegrationWindowLayout>
  )
}
