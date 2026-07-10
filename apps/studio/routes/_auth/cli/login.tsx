import { createFileRoute } from '@tanstack/react-router'

import CliLoginPage from '@/pages/cli/login'

export const Route = createFileRoute('/_auth/cli/login')({
  component: CliLogin,
})

function CliLogin() {
  // Next page default export is already wrapped in withAuth and inlines APIAuthorizationLayout.
  return <CliLoginPage dehydratedState={undefined} />
}
