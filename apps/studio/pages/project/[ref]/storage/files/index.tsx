import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { Loader2 } from 'lucide-react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EmptyBucketState } from 'components/interfaces/Storage/EmptyBucketState'
import { FilesBuckets } from 'components/interfaces/Storage/FilesBuckets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageFilesLayout } from 'components/layouts/StorageLayout/StorageFilesLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useBucketsQuery } from 'data/storage/buckets-query'
import type { NextPageWithLayout } from 'types'

const StorageFilesPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef: ref })
  const filesBuckets = buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage`)
  }, [isStorageV2, ref, router])

  if (isLoadingBuckets) {
    return (
      <div className="w-full h-full flex items-center justify-center gap-x-2">
        <Loader2 className="animate-spin text-foreground-light" size={16} />
        <p className="text-sm text-foreground-light">Loading buckets</p>
      </div>
    )
  }

  if (filesBuckets.length === 0) {
    return <EmptyBucketState bucketType="files" />
  }

  return (
    <StorageFilesLayout>
      <FilesBuckets />
    </StorageFilesLayout>
  )
}

StorageFilesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default StorageFilesPage
