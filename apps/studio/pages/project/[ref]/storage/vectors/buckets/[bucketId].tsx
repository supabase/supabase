import { useParams } from 'common'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { VectorBucketDetails } from 'components/interfaces/Storage/VectorBuckets/VectorBucketDetails'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useVectorBucketQuery } from 'data/storage/vector-bucket-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const VectorsBucketPage: NextPageWithLayout = () => {
  const { bucketId } = useParams()
  const { projectRef } = useStorageExplorerStateSnapshot()

  const {
    data: vectorBucket,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useVectorBucketQuery({ projectRef, vectorBucketName: bucketId })

  return (
    <div className="storage-container flex flex-grow">
      {isError && <StorageBucketsError error={error as any} />}

      {isLoading && <GenericSkeletonLoader className="w-full" />}

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
