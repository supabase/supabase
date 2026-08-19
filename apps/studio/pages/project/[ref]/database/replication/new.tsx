import { useRouter } from 'next/router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreatePipelineWizard } from '@/components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { IsolatedStudioFlowExit } from '@/components/layouts/Navigation/LayoutHeader/IsolatedStudioFlowClose'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const DatabaseReplicationNewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: selectedProject, isPending } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const showPgReplicate = useIsFeatureEnabled('database:replication')
  const schemasHref = `/project/${selectedProject?.ref}/database/schemas`

  if (!showPgReplicate) {
    return (
      <IsolatedStudioFlowExit onClose={() => router.push(schemasHref)}>
        <UnknownInterface urlBack={schemasHref} />
      </IsolatedStudioFlowExit>
    )
  }

  if (isHighAvailability) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <HighAvailabilityDisabledEmptyState
          title="Replication unavailable on High Availability projects"
          description="We're working to bring replication to High Availability projects. Contact support if this is blocking your work."
        />
      </div>
    )
  }

  return (
    <PipelineRequestStatusProvider>
      {isPending ? (
        <PageContainer size="full">
          <GenericSkeletonLoader />
        </PageContainer>
      ) : (
        <CreatePipelineWizard />
      )}
    </PipelineRequestStatusProvider>
  )
}

DatabaseReplicationNewPage.getLayout = (page) => (
  <DefaultLayout hideMobileMenu headerTitle="New pipeline">
    <ProjectLayoutWithAuth
      product="Database"
      browserTitle={{ section: 'New pipeline' }}
      isBlocking={false}
    >
      {page}
    </ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default DatabaseReplicationNewPage
