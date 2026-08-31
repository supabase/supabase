import { createFileRoute } from '@tanstack/react-router'

import BucketV2Page from '@/pages/project/[ref]/storage/files/bucketsV2/[bucketId]'

export const Route = createFileRoute('/project/$ref/storage/files/bucketsV2/$bucketId')({
  component: StorageFilesBucketV2Route,
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function StorageFilesBucketV2Route() {
  return <BucketV2Page dehydratedState={undefined} />
}
