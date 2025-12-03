import { useParams } from 'common'
import { BucketsComingSoon } from 'components/interfaces/Storage/BucketsComingSoon'
import { BucketsUpgradePlan } from 'components/interfaces/Storage/BucketsUpgradePlan'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorBuckets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useIsVectorBucketsEnabled } from 'data/config/project-storage-config-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const isPaidPlan = organization?.plan.id !== 'free'
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  if (!isVectorBucketsEnabled) {
    return <BucketsComingSoon type="vector" />
  } else if (!isPaidPlan) {
    return <BucketsUpgradePlan type="vector" />
  } else {
    return <VectorsBuckets />
  }
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
