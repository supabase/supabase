import { useState } from 'react'

import { useParams } from 'common'
import { EmptyBucketState } from './EmptyBucketState'
import { CreateBucketModalV2 } from './CreateBucketModalV2'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { Bucket } from 'data/storage/buckets-query'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)

  const { data: buckets = [], isLoading } = useBucketsQuery({ projectRef: ref })

  // Filter for standard buckets (files)
  const filesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')

  const handleCreateBucket = () => {
    setShowCreateBucketModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (filesBuckets.length === 0) {
    return (
      <>
        <EmptyBucketState bucketType="files" onCreateBucket={handleCreateBucket} />
        <CreateBucketModalV2
          visible={showCreateBucketModal}
          onOpenChange={setShowCreateBucketModal}
          defaultBucketType="STANDARD"
        />
      </>
    )
  }

  // TODO: Implement bucket list view when buckets exist
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Files Buckets</h2>
        <button
          onClick={handleCreateBucket}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Create Bucket
        </button>
      </div>

      <div className="grid gap-4">
        {filesBuckets.map((bucket) => (
          <div key={bucket.id} className="p-4 border rounded-lg">
            <h3 className="font-medium text-foreground">{bucket.name}</h3>
            <p className="text-sm text-foreground-light">
              {bucket.public ? 'Public' : 'Private'} • Created{' '}
              {new Date(bucket.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <CreateBucketModalV2
        visible={showCreateBucketModal}
        onOpenChange={setShowCreateBucketModal}
        defaultBucketType="STANDARD"
      />
    </div>
  )
}
