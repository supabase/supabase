import { createFileRoute } from '@tanstack/react-router'

import StorageReport from '@/pages/project/[ref]/observability/storage'

export const Route = createFileRoute('/project/$ref/observability/storage')({
  component: ObservabilityStorageRoute,
  staticData: {
    observabilityLayoutTitle: 'Storage',
  },
})

function ObservabilityStorageRoute() {
  return <StorageReport dehydratedState={undefined} />
}
