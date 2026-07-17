import { createFileRoute } from '@tanstack/react-router'

import VercelIntegrationWindowLayout from '@/components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'
import VercelIntegration from '@/pages/integrations/vercel/[slug]/deploy-button/new-project'

export const Route = createFileRoute('/integrations/vercel/$slug/deploy-button/new-project')({
  component: VercelDeployButtonNewProjectRoute,
})

// Mirrors the page's Next getLayout, which wraps this leaf (and only this
// leaf) in VercelIntegrationWindowLayout.
function VercelDeployButtonNewProjectRoute() {
  return (
    <VercelIntegrationWindowLayout>
      <VercelIntegration dehydratedState={undefined} />
    </VercelIntegrationWindowLayout>
  )
}
