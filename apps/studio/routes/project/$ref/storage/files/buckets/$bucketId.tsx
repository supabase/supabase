import { createFileRoute } from '@tanstack/react-router'

import BucketPage from '@/pages/project/[ref]/storage/files/buckets/[bucketId]'

export const Route = createFileRoute('/project/$ref/storage/files/buckets/$bucketId')({
  component: StorageFilesBucketRoute,
  // Bucket detail pages skip StorageBucketsLayout — they render the
  // bucket UI full-bleed under StorageLayout only.
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function StorageFilesBucketRoute() {
  return <BucketPage dehydratedState={undefined} />
}
