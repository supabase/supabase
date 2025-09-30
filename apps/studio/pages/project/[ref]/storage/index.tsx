import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const Storage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()

  useEffect(() => {
    if (isStorageV2) {
      router.replace(`/project/${ref}/storage/${DEFAULT_BUCKET_TYPE}`)
    } else {
      router.replace(`/project/${ref}/storage/buckets`)
    }
  }, [isStorageV2, ref, router])

  return null
}

Storage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default Storage
