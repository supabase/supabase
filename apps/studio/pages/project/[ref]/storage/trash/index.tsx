import { Trash } from '@/components/interfaces/Storage/Trash/Trash'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from '@/types'

const StorageTrashPage: NextPageWithLayout = () => {
  return <Trash />
}

StorageTrashPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Trash">{page}</StorageLayout>
  </DefaultLayout>
)

export default StorageTrashPage
