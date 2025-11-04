import Link from 'next/link'

import { useParams } from 'common'
import { AnalyticBucketDetails } from 'components/interfaces/Storage/AnalyticsBucketDetails'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { useSelectedBucket } from 'components/interfaces/Storage/StorageExplorer/useSelectedBucket'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { AnalyticsBucket } from 'data/storage/analytics-buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectRef } = useStorageExplorerStateSnapshot()
  const { bucket, error, isSuccess, isError } = useSelectedBucket()

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  // We can probably replace this with a better skeleton loader that's more representative of the page layout
  if (!project || !projectRef) return null

  return (
    <div className="storage-container flex flex-grow">
      {isError && <StorageBucketsError error={error as any} />}

      {isSuccess ? (
        !bucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <Admonition
              className="max-w-md"
              type="default"
              title="Unable to find bucket"
              description={`${bucketId ? `The bucket "${bucketId}"` : 'This bucket'} doesn’t seem to exist.`}
            >
              <Button asChild type="default" className="mt-2">
                <Link href={`/project/${projectRef}/storage/analytics`}>Head back</Link>
              </Button>
            </Admonition>
          </div>
        ) : (
          <AnalyticBucketDetails bucket={bucket as AnalyticsBucket} />
        )
      ) : null}
    </div>
  )
}

AnalyticsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default AnalyticsBucketPage
