import { Snapshots } from '@/components/interfaces/Storage/Snapshots/Snapshots'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from '@/types'

const StorageSnapshotsPage: NextPageWithLayout = () => {
  return <Snapshots />
}

StorageSnapshotsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Snapshots">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageSnapshotsPage
