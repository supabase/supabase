import { createFileRoute } from '@tanstack/react-router'

import Hooks from '@/pages/project/[ref]/auth/hooks'

export const Route = createFileRoute('/project/$ref/auth/hooks')({
  component: AuthHooksRoute,
  staticData: {
    authLayoutTitle: 'Auth Hooks',
  },
})

function AuthHooksRoute() {
  return <Hooks dehydratedState={undefined} />
}
