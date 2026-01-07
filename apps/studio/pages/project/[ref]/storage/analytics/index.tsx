import { useParams } from 'common'
import { AnalyticsBuckets } from 'components/interfaces/Storage/AnalyticsBuckets'
import { BucketsUpgradePlan } from 'components/interfaces/Storage/BucketsUpgradePlan'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import type { NextPageWithLayout } from 'types'

const StorageAnalyticsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef })

  if (!isAnalyticsBucketsEnabled) {
    return <BucketsUpgradePlan type="analytics" />
  } else {
    return <AnalyticsBuckets />
  }
}

StorageAnalyticsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageAnalyticsPage
