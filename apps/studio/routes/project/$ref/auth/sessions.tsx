import { createFileRoute } from '@tanstack/react-router'

import SessionsPage from '@/pages/project/[ref]/auth/sessions'

export const Route = createFileRoute('/project/$ref/auth/sessions')({
  component: AuthSessionsRoute,
  staticData: {
    authLayoutTitle: 'Sessions',
  },
})

function AuthSessionsRoute() {
  return <SessionsPage dehydratedState={undefined} />
}
