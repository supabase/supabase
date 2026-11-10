import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM, useParams } from 'common'

import { BucketsUpgradePlan } from '@/components/interfaces/Storage/BucketsUpgradePlan'
import { VectorsBuckets } from '@/components/interfaces/Storage/VectorBuckets'
import { useIsVectorBucketsEnabled } from '@/data/config/project-storage-config-query'

export const Route = createFileRoute('/project/$ref/storage/vectors/')({
  component: StorageVectorsPage,
  staticData: {
    storageLayoutTitle: 'Vectors',
  },
})

function StorageVectorsPage() {
  const { ref: projectRef } = useParams()
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  if (IS_PLATFORM && !isVectorBucketsEnabled) {
    return <BucketsUpgradePlan type="vector" />
  } else if (!isVectorBucketsEnabled) {
    return null
  } else {
    return <VectorsBuckets />
  }
}
