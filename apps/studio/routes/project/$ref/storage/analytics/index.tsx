import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { AnalyticsBuckets } from '@/components/interfaces/Storage/AnalyticsBuckets'
import { BucketsUpgradePlan } from '@/components/interfaces/Storage/BucketsUpgradePlan'
import { useIsAnalyticsBucketsEnabled } from '@/data/config/project-storage-config-query'

export const Route = createFileRoute('/project/$ref/storage/analytics/')({
  component: StorageAnalyticsPage,
  staticData: {
    storageLayoutTitle: 'Analytics',
  },
})

function StorageAnalyticsPage() {
  const { ref: projectRef } = useParams()
  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef })

  if (!isAnalyticsBucketsEnabled) {
    return <BucketsUpgradePlan type="analytics" />
  } else {
    return <AnalyticsBuckets />
  }
}
