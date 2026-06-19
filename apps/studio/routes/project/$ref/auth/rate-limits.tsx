import { createFileRoute } from '@tanstack/react-router'

import RateLimitsPage from '@/pages/project/[ref]/auth/rate-limits'

export const Route = createFileRoute('/project/$ref/auth/rate-limits')({
  component: AuthRateLimitsRoute,
  staticData: {
    authLayoutTitle: 'Rate Limits',
  },
})

function AuthRateLimitsRoute() {
  return <RateLimitsPage dehydratedState={undefined} />
}
