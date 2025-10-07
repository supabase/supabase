import { Edit, Shield } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { EditBucketModal } from 'components/interfaces/Storage/EditBucketModal'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { StorageExplorer } from 'components/interfaces/Storage/StorageExplorer/StorageExplorer'
import { useSelectedBucket } from 'components/interfaces/Storage/StorageExplorer/useSelectedBucket'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStoragePolicyCounts } from 'hooks/storage/useStoragePolicyCounts'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'
import { Badge, Button } from 'ui'

const BucketPage: NextPageWithLayout = () => {
  const { bucketId, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectRef } = useStorageExplorerStateSnapshot()
  const { bucket, error, isSuccess, isError } = useSelectedBucket()
  const [showEditModal, setShowEditModal] = useState(false)

  const { getPolicyCount } = useStoragePolicyCounts(bucket ? [bucket] : [])
  const policyCount = bucket ? getPolicyCount(bucket.name) : 0

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  if (!project || !projectRef || !isSuccess) return null

  if (isError) {
    return <StorageBucketsError error={error as any} />
  }

  // If the bucket is not found or the bucket type is ANALYTICS or VECTOR, show an error message
  if (!bucket || bucket.type !== 'STANDARD') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-foreground-light">Bucket "{bucketId}" cannot be found</p>
      </div>
    )
  }

  return (
    <>
      <PageLayout
        size="full"
        isCompact
        className="[&>div:first-child]:!border-b-0" // Override the border-b from ScaffoldContainer
        title={
          <div className="flex items-center gap-2">
            <span>{bucket.name}</span>
            {bucket.public && <Badge variant="warning">Public</Badge>}
          </div>
        }
        breadcrumbs={[
          {
            label: 'Files',
            href: `/project/${ref}/storage/files`,
          },
        ]}
        primaryActions={
          <>
            <Button
              asChild
              type="default"
              icon={<Shield size={14} />}
              iconRight={
                policyCount > 0 ? (
                  <span className="w-4 h-4 bg-surface-200 text-foreground-light text-xs rounded-full flex items-center justify-center font-medium">
                    {policyCount}
                  </span>
                ) : undefined
              }
            >
              <Link href={`/project/${ref}/storage/files/policies`}>Policies</Link>
            </Button>
            <Button type="default" icon={<Edit size={14} />} onClick={() => setShowEditModal(true)}>
              Edit bucket
            </Button>
          </>
        }
      >
        <div className="flex-1 min-h-0 px-6 pb-6">
          <StorageExplorer bucket={bucket} />
        </div>
      </PageLayout>

      <EditBucketModal
        visible={showEditModal}
        bucket={bucket}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}

BucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default BucketPage
