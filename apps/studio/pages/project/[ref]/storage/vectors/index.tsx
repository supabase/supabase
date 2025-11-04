import { BucketsComingSoon } from 'components/interfaces/Storage/BucketsComingSoon'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorsBuckets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const StorageVectorsPage: NextPageWithLayout = () => {
  const isVectorBucketsEnabled = false
  return isVectorBucketsEnabled ? <VectorsBuckets /> : <BucketsComingSoon type="vector" />
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
