import { createFileRoute } from '@tanstack/react-router'

import { EdgeFunctionOverview } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/')({
  component: FunctionOverviewPage,
  staticData: {
    edgeFunctionDetailsTitle: 'Overview',
  },
})

function FunctionOverviewPage() {
  return <EdgeFunctionOverview />
}
