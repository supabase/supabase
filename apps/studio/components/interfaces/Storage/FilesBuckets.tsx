import { useState } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { EmptyBucketState } from './EmptyBucketState'
import { CreateBucketModal } from './CreateBucketModal'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { Bucket } from 'data/storage/buckets-query'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Button } from 'ui'
import { Plus } from 'lucide-react'
import { StoragePolicies } from './StoragePolicies/StoragePolicies'
import { StorageSettings } from './StorageSettings/StorageSettings'
import { S3Connection } from './StorageSettings/S3Connection'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const router = useRouter()
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)

  const { data: buckets = [], isLoading } = useBucketsQuery({ projectRef: ref })

  // Filter for standard buckets (files)
  const filesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')

  const handleCreateBucket = () => {
    setShowCreateBucketModal(true)
  }

  // Determine which tab is active based on the current path
  const getActiveTab = () => {
    const path = router.asPath
    if (path.includes('/storage/files/settings')) return 'settings'
    if (path.includes('/storage/files/policies')) return 'policies'
    return 'buckets'
  }

  const activeTab = getActiveTab()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-12">
            <StorageSettings />
            <S3Connection />
          </div>
        )
      case 'policies':
        return <StoragePolicies />
      case 'buckets':
      default:
        if (filesBuckets.length === 0) {
          return (
            <>
              <EmptyBucketState bucketType="files" onCreateBucket={handleCreateBucket} />
              <CreateBucketModal
                hideAnalyticsOption={true}
                visible={showCreateBucketModal}
                onOpenChange={setShowCreateBucketModal}
              />
            </>
          )
        }

        return (
          <div className="space-y-12">
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader
                  title="Buckets"
                  actions={
                    <Button type="primary" icon={<Plus size={14} />} onClick={handleCreateBucket}>
                      New file bucket
                    </Button>
                  }
                />

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
              </div>
            </ScaffoldSection>
          </div>
        )
    }
  }

  return (
    <>
      {renderTabContent()}
      <CreateBucketModal
        hideAnalyticsOption={true}
        visible={showCreateBucketModal}
        onOpenChange={setShowCreateBucketModal}
      />
    </>
  )
}
