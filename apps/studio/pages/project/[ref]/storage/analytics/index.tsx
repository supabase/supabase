import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AnalyticsBuckets } from 'components/interfaces/Storage/AnalyticsBuckets'
import { EmptyBucketState } from 'components/interfaces/Storage/EmptyBucketState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useBucketsQuery } from 'data/storage/buckets-query'
import type { NextPageWithLayout } from 'types'
import { Loader2 } from 'lucide-react'

const StorageAnalyticsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef: ref })
  const analyticsBuckets = buckets.filter((bucket) => bucket.type === 'ANALYTICS')

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage`)
  }, [isStorageV2, ref, router])

  // TODO: Make consistent with storage/files/index.tsx
  if (isLoadingBuckets) {
    return (
      <div className="w-full h-full flex items-center justify-center gap-x-2">
        <Loader2 className="animate-spin text-foreground-light" size={16} />
        <p className="text-sm text-foreground-light">Loading buckets</p>
      </div>
    )
  }

  if (analyticsBuckets.length === 0) {
    return <EmptyBucketState bucketType="analytics" />
  }

  return <AnalyticsBuckets />
}

StorageAnalyticsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default StorageAnalyticsPage
