import { createFileRoute } from '@tanstack/react-router'

import WorkerSecretsPage, { WorkerSecretsPageWrapper } from '@/pages/project/[ref]/workers/secrets'

export const Route = createFileRoute('/project/$ref/workers/secrets')({
  component: WorkerSecretsRoute,
  staticData: {
    workersLayoutTitle: 'Secrets',
  },
})

function WorkerSecretsRoute() {
  return (
    <WorkerSecretsPageWrapper>
      <WorkerSecretsPage dehydratedState={undefined} />
    </WorkerSecretsPageWrapper>
  )
}
