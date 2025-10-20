import { BucketDetails } from 'components/interfaces/Storage/VectorBuckets/BucketDetails'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const StorageVectorsPage: NextPageWithLayout = () => {
  return <BucketDetails />
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
