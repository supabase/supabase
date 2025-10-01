import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BUCKET_TYPES, DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import { FilesBuckets } from 'components/interfaces/Storage/FilesBuckets'
import { AnalyticsBuckets } from 'components/interfaces/Storage/AnalyticsBuckets'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorsBuckets'
import { BucketTypeLayout } from 'components/layouts/StorageLayout/BucketLayout'
import type { NextPageWithLayout } from 'types'

const BucketTypePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { bucketType, ref } = useParams()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage`)
  }, [isStorageV2, ref])

  useEffect(() => {
    if (!config) {
      router.replace(`/project/${ref}/storage`)
    }
  }, [config, ref, router])

  const renderBucketTypeContent = () => {
    switch (bucketTypeKey) {
      case 'files':
        return <FilesBuckets />
      case 'analytics':
        return <AnalyticsBuckets />
      case 'vectors':
        return <VectorsBuckets />
      default:
        return <FilesBuckets />
    }
  }

  return <div>{renderBucketTypeContent()}</div>
}

BucketTypePage.getLayout = (page) => {
  return <BucketTypeLayout>{page}</BucketTypeLayout>
}

export default BucketTypePage
