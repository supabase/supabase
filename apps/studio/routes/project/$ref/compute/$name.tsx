import { createFileRoute } from '@tanstack/react-router'

import InstanceDetailPage from '@/pages/project/[ref]/compute/[name]'

export const Route = createFileRoute('/project/$ref/compute/$name')({
  component: InstanceDetailRoute,
  staticData: {
    computeLayoutTitle: 'Instance',
  },
})

function InstanceDetailRoute() {
  return <InstanceDetailPage dehydratedState={undefined} />
}
