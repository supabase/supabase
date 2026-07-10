import { createFileRoute } from '@tanstack/react-router'

import RealtimePoliciesPage from '@/pages/project/[ref]/realtime/policies'

export const Route = createFileRoute('/project/$ref/realtime/policies')({
  component: RealtimePoliciesRoute,
  staticData: {
    realtimeLayoutTitle: 'Policies',
  },
})

function RealtimePoliciesRoute() {
  return <RealtimePoliciesPage dehydratedState={undefined} />
}
