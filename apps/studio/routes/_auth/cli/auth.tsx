import { createFileRoute } from '@tanstack/react-router'

import CliAuthPage from '@/pages/cli/auth'

export const Route = createFileRoute('/_auth/cli/auth')({
  component: CliAuth,
})

function CliAuth() {
  return <CliAuthPage dehydratedState={undefined} />
}
