import { createFileRoute } from '@tanstack/react-router'

import MfaPage from '@/pages/project/[ref]/auth/mfa'

export const Route = createFileRoute('/project/$ref/auth/mfa')({
  component: AuthMfaRoute,
  staticData: {
    authLayoutTitle: 'Multi-Factor',
  },
})

function AuthMfaRoute() {
  return <MfaPage dehydratedState={undefined} />
}
