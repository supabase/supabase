import { useParams } from 'common'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { VectorBucketDetails } from 'components/interfaces/Storage/VectorBuckets/VectorBucketDetails'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useVectorBucketQuery } from 'data/storage/vector-bucket-query'
import Link from 'next/link'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

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

      {isLoading && (
        <ScaffoldContainer>
          <ScaffoldSection isFullWidth>
            <GenericSkeletonLoader />
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      {isSuccess ? (
        !vectorBucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <Admonition
              className="max-w-md"
              type="default"
              title="Unable to find bucket"
              description={`${bucketId ? `The template "${bucketId}"` : 'This template'} doesn’t seem to exist.`}
            >
              <Button asChild type="default" className="mt-2">
                <Link href={`/project/${projectRef}/storage/vectors`}>Head back</Link>
              </Button>
            </Admonition>
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
