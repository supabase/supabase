import { createFileRoute } from '@tanstack/react-router'

import AuthOverview from '@/pages/project/[ref]/auth/overview'

export const Route = createFileRoute('/project/$ref/auth/overview')({
  component: AuthOverviewRoute,
  staticData: {
    authLayoutTitle: 'Overview',
  },
})

function AuthOverviewRoute() {
  return <AuthOverview dehydratedState={undefined} />
}
