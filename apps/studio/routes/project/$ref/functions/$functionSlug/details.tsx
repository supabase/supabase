import { createFileRoute } from '@tanstack/react-router'

import FunctionDetailsPage from '@/pages/project/[ref]/functions/[functionSlug]/details'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/details')({
  component: FunctionDetailsRoute,
  staticData: {
    edgeFunctionDetailsTitle: 'Settings',
  },
})

function FunctionDetailsRoute() {
  return <FunctionDetailsPage dehydratedState={undefined} />
}
