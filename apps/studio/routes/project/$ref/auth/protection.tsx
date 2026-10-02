import { createFileRoute } from '@tanstack/react-router'

import ProtectionPage from '@/pages/project/[ref]/auth/protection'

export const Route = createFileRoute('/project/$ref/auth/protection')({
  component: AuthProtectionRoute,
  staticData: {
    authLayoutTitle: 'Attack Protection',
  },
})

function AuthProtectionRoute() {
  return <ProtectionPage dehydratedState={undefined} />
}
