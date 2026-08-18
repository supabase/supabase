import { createFileRoute } from '@tanstack/react-router'

import WorkerDetailPage from '@/pages/project/[ref]/workers/[name]'

export const Route = createFileRoute('/project/$ref/workers/$name')({
  component: WorkerDetailRoute,
  staticData: {
    workersLayoutTitle: 'Worker',
  },
})

function WorkerDetailRoute() {
  return <WorkerDetailPage />
}
