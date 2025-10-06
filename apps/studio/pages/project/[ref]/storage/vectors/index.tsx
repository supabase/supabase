import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { EmptyBucketState } from 'components/interfaces/Storage/EmptyBucketState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'
import { StorageSpecializedLayout } from 'components/layouts/StorageLayout/StorageSpecializedLayout'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorsBuckets'

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage`)
  }, [isStorageV2, ref, router])

  return (
    <StorageSpecializedLayout bucketType="vectors">
      <VectorsBuckets />
    </StorageSpecializedLayout>
  )
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
