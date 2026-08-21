import { useState } from 'react'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DiskManagementForm } from '@/components/interfaces/DiskManagement/DiskManagementForm'
import { InfrastructureTopology } from '@/components/interfaces/Settings/Infrastructure/InfrastructureTopology'
import { ReadReplicasSection } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicasSection'
import type { RecommendedComputeForReadReplicas } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/recommendCompute'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const InfrastructureSettings: NextPageWithLayout = () => {
  const [recommendedCompute, setRecommendedCompute] =
    useState<RecommendedComputeForReadReplicas | null>(null)

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Infrastructure</PageHeaderTitle>
            <PageHeaderDescription>
              Configure compute, disk, and read replicas for your project.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <DiskManagementForm
        overviewExtra={<InfrastructureTopology />}
        beforeScaling={<ReadReplicasSection onRecommendCompute={setRecommendedCompute} />}
        recommendedCompute={recommendedCompute}
        onRecommendedComputeApplied={() => setRecommendedCompute(null)}
      />
    </>
  )
}

InfrastructureSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)
export default InfrastructureSettings
