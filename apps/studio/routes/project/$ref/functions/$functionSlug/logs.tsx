import { createFileRoute } from '@tanstack/react-router'

import FunctionLogsPage from '@/pages/project/[ref]/functions/[functionSlug]/logs'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/logs')({
  component: FunctionLogsRoute,
  staticData: {
    edgeFunctionDetailsTitle: 'Logs',
  },
})

function FunctionLogsRoute() {
  return <FunctionLogsPage dehydratedState={undefined} />
}
