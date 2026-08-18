import { createFileRoute } from '@tanstack/react-router'

import { PRODUCT_NAME } from '@/lib/constants/workers'
import WorkersPage from '@/pages/project/[ref]/workers/index'

export const Route = createFileRoute('/project/$ref/workers/')({
  component: WorkersIndexRoute,
  staticData: {
    workersLayoutTitle: PRODUCT_NAME,
  },
})

function WorkersIndexRoute() {
  return <WorkersPage />
}
