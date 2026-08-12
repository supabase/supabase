import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/integrations/vercel')({
  component: VercelIntegrationPassthrough,
})

// No shared layout here. Since #47623, the Vercel install, marketplace
// choose-project, and deploy-button/new-project pages each render their own
// InterstitialLayout and have no Next getLayout / window chrome.
function VercelIntegrationPassthrough() {
  return <Outlet />
}
