import { createFileRoute } from '@tanstack/react-router'

import { EdgeFunctionOverview } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/')({
  component: EdgeFunctionOverview,
  staticData: {
    edgeFunctionDetailsTitle: 'Overview',
  },
})
