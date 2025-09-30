import { useFlag } from 'common'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import type { NextPageWithLayout } from 'types'

const Storage: NextPageWithLayout = () => {
  const isStorageV2 = useFlag('storageAnalyticsVector')
  const { ref } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (isStorageV2) {
      router.replace(`/project/${ref}/storage/${DEFAULT_BUCKET_TYPE}`)
    } else {
      router.replace(`/project/${ref}/storage/buckets`)
    }
  }, [isStorageV2, ref, router])

  return null // Will redirect, so return nothing
}

Storage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default Storage
