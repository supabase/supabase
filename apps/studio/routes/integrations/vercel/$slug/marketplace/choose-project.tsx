import { createFileRoute } from '@tanstack/react-router'

import VercelIntegration from '@/pages/integrations/vercel/[slug]/marketplace/choose-project'

export const Route = createFileRoute('/integrations/vercel/$slug/marketplace/choose-project')({
  component: VercelChooseProjectRoute,
})

function VercelChooseProjectRoute() {
  return <VercelIntegration dehydratedState={undefined} />
}
