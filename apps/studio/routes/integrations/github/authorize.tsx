import { createFileRoute } from '@tanstack/react-router'

import GitHubIntegrationAuthorize from '@/pages/integrations/github/authorize'

export const Route = createFileRoute('/integrations/github/authorize')({
  component: GitHubAuthorizeRoute,
})

// Placed at top-level — the Next page has no getLayout (renders bare),
// so adding AppLayout/DefaultLayout via _app would be a behaviour change.
function GitHubAuthorizeRoute() {
  return <GitHubIntegrationAuthorize />
}
