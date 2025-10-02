import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ReactNode } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BUCKET_TYPES, DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import { FilesBuckets } from 'components/interfaces/Storage/FilesBuckets'
import { AnalyticsBuckets } from 'components/interfaces/Storage/AnalyticsBuckets'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorsBuckets'
import { BucketTypeLayout } from 'components/layouts/StorageLayout/BucketLayout'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { Bucket } from 'data/storage/buckets-query'
import type { NextPageWithLayout } from 'types'

const BucketTypePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { bucketType, ref } = useParams()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

  // Get buckets data to determine if it's an empty state
  const { data: buckets = [], isLoading: bucketsLoading } = useBucketsQuery({ projectRef: ref })

  const getBucketTypeResult = () => {
    switch (bucketTypeKey) {
      case 'files':
        const filesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')
        return {
          component: <FilesBuckets />,
          isEmpty: filesBuckets.length === 0 && !bucketsLoading,
        }
      case 'analytics':
        const analyticsBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'ANALYTICS')
        return {
          component: <AnalyticsBuckets />,
          isEmpty: analyticsBuckets.length === 0 && !bucketsLoading,
        }
      case 'vectors':
        // Vectors buckets don't exist yet, so always show empty state
        return {
          component: <VectorsBuckets />,
          isEmpty: true,
        }
      default:
        const defaultFilesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')
        return {
          component: <FilesBuckets />,
          isEmpty: defaultFilesBuckets.length === 0 && !bucketsLoading,
        }
    }
  }

  const bucketTypeResult = getBucketTypeResult()

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage`)
  }, [isStorageV2, ref, router])

  useEffect(() => {
    if (!config) {
      router.replace(`/project/${ref}/storage`)
    }
  }, [config, ref, router])

  return <>{bucketTypeResult.component}</>
}

// Create a wrapper component that can access bucket data
const BucketTypePageWrapper = ({ children }: { children: ReactNode }) => {
  const { bucketType, ref } = useParams()
  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE

  // Get buckets data to determine if it's an empty state
  const { data: buckets = [], isLoading: bucketsLoading } = useBucketsQuery({ projectRef: ref })

  const getIsEmpty = () => {
    switch (bucketTypeKey) {
      case 'files':
        const filesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')
        return filesBuckets.length === 0 && !bucketsLoading
      case 'analytics':
        const analyticsBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'ANALYTICS')
        return analyticsBuckets.length === 0 && !bucketsLoading
      case 'vectors':
        // Vectors buckets don't exist yet, so always show empty state
        return true
      default:
        const defaultFilesBuckets = buckets.filter((bucket: Bucket) => bucket.type === 'STANDARD')
        return defaultFilesBuckets.length === 0 && !bucketsLoading
    }
  }

  return <BucketTypeLayout isEmpty={getIsEmpty()}>{children}</BucketTypeLayout>
}

BucketTypePage.getLayout = (page) => {
  return <BucketTypePageWrapper>{page}</BucketTypePageWrapper>
}

export default BucketTypePage
