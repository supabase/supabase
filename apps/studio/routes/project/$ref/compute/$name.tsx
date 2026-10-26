import { createFileRoute } from '@tanstack/react-router'

import ComputeInstanceDetailPage from '@/pages/project/[ref]/compute/[name]'

export const Route = createFileRoute('/project/$ref/compute/$name')({
  component: ComputeInstanceDetailRoute,
  staticData: {
    computeLayoutTitle: 'Instance',
  },
})

function ComputeInstanceDetailRoute() {
  return <ComputeInstanceDetailPage dehydratedState={undefined} />
}
