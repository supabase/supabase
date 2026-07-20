import { createFileRoute } from '@tanstack/react-router'

import VercelIntegration from '@/pages/integrations/vercel/[slug]/deploy-button/new-project'

export const Route = createFileRoute('/integrations/vercel/$slug/deploy-button/new-project')({
  component: VercelIntegration,
})
