import { createFileRoute } from '@tanstack/react-router'

import FunctionInvocationsPage from '@/pages/project/[ref]/functions/[functionSlug]/invocations'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/invocations')({
  component: FunctionInvocationsRoute,
  staticData: {
    edgeFunctionDetailsTitle: 'Invocations',
  },
})

function FunctionInvocationsRoute() {
  return <FunctionInvocationsPage dehydratedState={undefined} />
}
