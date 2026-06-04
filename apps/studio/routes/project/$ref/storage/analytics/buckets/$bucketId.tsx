import { createFileRoute } from '@tanstack/react-router'

import AnalyticsBucketPage from '@/pages/project/[ref]/storage/analytics/buckets/[bucketId]'

export const Route = createFileRoute('/project/$ref/storage/analytics/buckets/$bucketId')({
  component: StorageAnalyticsBucketRoute,
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function StorageAnalyticsBucketRoute() {
  return <AnalyticsBucketPage dehydratedState={undefined} />
}
