import { Snapshots } from '@/components/interfaces/Storage/Snapshots/Snapshots'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from '@/types'

const StorageSnapshotsPage: NextPageWithLayout = () => {
  return <Snapshots />
}

StorageSnapshotsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Snapshots">{page}</StorageLayout>
  </DefaultLayout>
)

export default StorageSnapshotsPage
