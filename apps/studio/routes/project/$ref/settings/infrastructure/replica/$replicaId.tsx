import { createFileRoute } from '@tanstack/react-router'

import InfrastructureReadReplicaPage from '@/pages/project/[ref]/settings/infrastructure/replica/[replicaId]'

export const Route = createFileRoute('/project/$ref/settings/infrastructure/replica/$replicaId')({
  component: InfrastructureReadReplicaRoute,
  staticData: { settingsLayoutTitle: 'Infrastructure' },
})

function InfrastructureReadReplicaRoute() {
  return <InfrastructureReadReplicaPage dehydratedState={undefined} />
}
