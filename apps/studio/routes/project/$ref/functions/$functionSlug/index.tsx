import { createFileRoute } from '@tanstack/react-router'

import FunctionOverviewPage from '@/pages/project/[ref]/functions/[functionSlug]/index'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/')({
  component: FunctionOverviewRoute,
  staticData: {
    edgeFunctionDetailsTitle: 'Overview',
  },
})

function FunctionOverviewRoute() {
  return <FunctionOverviewPage dehydratedState={undefined} />
}
