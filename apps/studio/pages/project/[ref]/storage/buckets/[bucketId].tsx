import { useParams } from 'common'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { StorageExplorer } from 'components/interfaces/Storage'
import { AnalyticBucketDetails } from 'components/interfaces/Storage/AnalyticBucketDetails'
import { useSelectedBucket } from 'components/interfaces/Storage/StorageExplorer/useSelectedBucket'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { bucketId } = useParams()
  const { project } = useProjectContext()
  const { projectRef } = useStorageExplorerStateSnapshot()
  const { bucket, error, isSuccess, isError } = useSelectedBucket()

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  if (!project || !projectRef) return null

  return (
    <div className="storage-container flex flex-grow">
      {isError && <StorageBucketsError error={error as any} />}

      {isSuccess ? (
        !bucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-foreground-light">Bucket {bucketId} cannot be found</p>
          </div>
        ) : bucket.type === 'ANALYTICS' ? (
          <AnalyticBucketDetails bucket={bucket} />
        ) : (
          <StorageExplorer bucket={bucket} />
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
