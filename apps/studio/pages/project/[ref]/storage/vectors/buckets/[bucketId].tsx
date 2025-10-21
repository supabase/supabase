import { VectorBucketDetails } from 'components/interfaces/Storage/VectorBuckets/VectorBucketDetails'

import { useParams } from 'common'

import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'

const VectorsBucketPage: NextPageWithLayout = () => {
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectRef } = useStorageExplorerStateSnapshot()

  // Fetch vector buckets instead of regular buckets
  const {
    data: vectorBucketsData,
    isSuccess,
    isError,
    error,
  } = useVectorBucketsQuery({ projectRef })
  const vectorBucket = vectorBucketsData?.vectorBuckets?.find(
    (bucket) => bucket.vectorBucketName === bucketId
  )

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  if (!project || !projectRef) return null

  return (
    <div className="storage-container flex flex-grow p-4">
      {isError && <StorageBucketsError error={error as any} />}

      {isSuccess ? (
        !vectorBucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-foreground-light">Bucket {bucketId} cannot be found</p>
          </div>
        ) : (
          <VectorBucketDetails bucket={vectorBucket} />
        )
      ) : null}
    </div>
  )
}

VectorsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default VectorsBucketPage
