import { createFileRoute } from '@tanstack/react-router'

import VercelIntegration from '@/pages/integrations/vercel/install'

export const Route = createFileRoute('/integrations/vercel/install')({
  component: VercelInstallRoute,
})

function VercelInstallRoute() {
  return <VercelIntegration dehydratedState={undefined} />
}
