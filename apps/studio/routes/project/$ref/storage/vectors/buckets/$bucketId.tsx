import { createFileRoute } from '@tanstack/react-router'

import VectorsBucketPage from '@/pages/project/[ref]/storage/vectors/buckets/[bucketId]'

export const Route = createFileRoute('/project/$ref/storage/vectors/buckets/$bucketId')({
  component: StorageVectorsBucketRoute,
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function StorageVectorsBucketRoute() {
  return <VectorsBucketPage dehydratedState={undefined} />
}
