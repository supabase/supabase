import { createFileRoute } from '@tanstack/react-router'

import StorageAnalyticsPage from '@/pages/project/[ref]/storage/analytics/index'

export const Route = createFileRoute('/project/$ref/storage/analytics/')({
  component: StorageAnalyticsIndexRoute,
  staticData: {
    storageLayoutTitle: 'Analytics',
  },
})

function StorageAnalyticsIndexRoute() {
  return <StorageAnalyticsPage dehydratedState={undefined} />
}
