import { useParams } from 'common'

import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { BucketHeader } from 'components/interfaces/Storage/StorageExplorer/BucketHeader'
import { StorageExplorer } from 'components/interfaces/Storage/StorageExplorer/StorageExplorer'
import { useSelectedBucket } from 'components/interfaces/Storage/StorageExplorer/useSelectedBucket'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectRef } = useStorageExplorerStateSnapshot()
  const { bucket, error, isSuccess, isError } = useSelectedBucket()

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  if (!project || !projectRef) return null

  return (
    <div className="flex flex-col flex-grow p-4">
      {isError && <StorageBucketsError error={error as any} />}

      {isSuccess ? (
        // If the bucket is not found or the bucket type is ANALYTICS or VECTOR, show an error message
        !bucket || bucket.type !== 'STANDARD' ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-foreground-light">Bucket “{bucketId}” cannot be found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <BucketHeader bucket={bucket} />
            <StorageExplorer bucket={bucket} />
          </div>
        )
      ) : (
        <div />
      )}
    </div>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default PageLayout
