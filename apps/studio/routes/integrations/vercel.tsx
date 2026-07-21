import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/integrations/vercel')({
  component: VercelIntegrationPassthrough,
})

// No shared layout here. Since #47623, the install and
// marketplace/choose-project pages render their own InterstitialLayout and
// have no Next getLayout, so the Next runtime shows them without any window
// chrome. Only deploy-button/new-project still uses
// VercelIntegrationWindowLayout, and its route wraps it at the leaf.
function VercelIntegrationPassthrough() {
  return <Outlet />
}
