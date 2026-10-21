import { createFileRoute } from '@tanstack/react-router'

import { PRODUCT_NAME } from '@/lib/constants/compute'
import ComputePage from '@/pages/project/[ref]/compute/index'

export const Route = createFileRoute('/project/$ref/compute/')({
  component: ComputeIndexRoute,
  staticData: {
    computeLayoutTitle: PRODUCT_NAME,
  },
})

function ComputeIndexRoute() {
  return <ComputePage dehydratedState={undefined} />
}
