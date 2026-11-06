import { createFileRoute } from '@tanstack/react-router'

import LogPage from '@/pages/project/[ref]/logs/index'

export const Route = createFileRoute('/project/$ref/logs/')({
  component: LogsIndexRoute,
  staticData: {
    // Page body wraps in its own <ProjectLayout> conditionally; LogsLayout
    // is not appropriate here.
    skipLogsLayout: true,
  },
})

function LogsIndexRoute() {
  return <LogPage dehydratedState={undefined} />
}
