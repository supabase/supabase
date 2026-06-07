import { useParams } from 'common'

import { VectorsBuckets } from '@/components/interfaces/Storage/VectorBuckets'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import { useIsVectorBucketsEnabled } from '@/data/config/project-storage-config-query'
import type { NextPageWithLayout } from '@/types'

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  // [console fork] Self-host: no per-region availability gate and no "Upgrade to
  // Pro" — vector buckets are available wherever the project runs. The only switch
  // is the Storage settings toggle (features.vectorBuckets.enabled).
  if (!isVectorBucketsEnabled) {
    return null
  }
  return <VectorsBuckets />
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Vectors">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
