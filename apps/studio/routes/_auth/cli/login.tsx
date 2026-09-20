import { createFileRoute } from '@tanstack/react-router'

import CliLoginPage from '@/pages/cli/login'

export const Route = createFileRoute('/_auth/cli/login')({
  component: CliLogin,
})

function CliLogin() {
  // Next page default export is already wrapped in withAuth and inlines InterstitialLayout
  // (via a local CliLoginInterstitial wrapper).
  return <CliLoginPage dehydratedState={undefined} />
}
