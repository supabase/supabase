import { createFileRoute } from '@tanstack/react-router'

import { ComputeInstanceDetail } from '@/components/interfaces/Compute/ComputeInstanceDetail/ComputeInstanceDetail'

export const Route = createFileRoute('/project/$ref/compute/$name')({
  component: ComputeInstanceDetailPage,
  staticData: {
    computeLayoutTitle: 'Instance',
  },
})

function ComputeInstanceDetailPage() {
  return <ComputeInstanceDetail />
}
