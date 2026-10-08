import { UrlSigningKeys } from '@/components/interfaces/Storage/UrlSigningKeys/UrlSigningKeys'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from '@/types'

const StorageSigningKeysPage: NextPageWithLayout = () => {
  return <UrlSigningKeys />
}

StorageSigningKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="URL Signing Keys">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageSigningKeysPage
