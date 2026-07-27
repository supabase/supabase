import { Trash } from '@/components/interfaces/Storage/Trash/Trash'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from '@/types'

const StorageTrashPage: NextPageWithLayout = () => {
  return <Trash />
}

StorageTrashPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Trash">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageTrashPage
