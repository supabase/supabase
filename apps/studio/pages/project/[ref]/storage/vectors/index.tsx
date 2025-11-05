import { useParams } from 'common'
import { BucketsComingSoon } from 'components/interfaces/Storage/BucketsComingSoon'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorBuckets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useIsVectorBucketsEnabled } from 'data/config/project-storage-config-query'
import type { NextPageWithLayout } from 'types'

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })
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
