import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { Destinations } from '@/components/interfaces/Database/Replication/Destinations'
import { ReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram'
import { EmptyReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram/EmptyReplicationDiagram'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { data: selectedProject, isPending } = useSelectedProjectQuery()
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${selectedProject?.ref}/database/schemas`} />
  }

  return (
    <PipelineRequestStatusProvider>
      <ScaffoldContainer>
        <ScaffoldSection isFullWidth>
          <div className="w-full mb-6">
            <div className="flex items-center gap-x-2 mb-1">
              <h3 className="text-foreground text-xl prose">Replication</h3>
            </div>
            <p className="prose text-sm max-w-full">
              Deploy read replicas across multiple regions, or replicate database changes to
              external data warehouses and analytics platforms
            </p>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      {isPending ? (
        <ScaffoldContainer>
          <GenericSkeletonLoader />
        </ScaffoldContainer>
      ) : selectedProject?.high_availability ? (
        <>
          <EmptyReplicationDiagram />

          <ScaffoldContainer>
            <ScaffoldSection isFullWidth className="pt-6!">
              <Admonition
                variant="default"
                title="Replication is not available for High Availability projects"
              >
                Replication is not currently available for projects with High Availability. Please
                contact{' '}
                <a
                  href="https://supabase.com/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  support
                </a>{' '}
                if you are interested in using this feature with your High Availability project.
              </Admonition>
            </ScaffoldSection>
          </ScaffoldContainer>
        </>
      ) : (
        <>
          <ReplicationDiagram />
          <ScaffoldContainer>
            <ScaffoldSection isFullWidth className="pt-6!">
              <Destinations />
            </ScaffoldSection>
          </ScaffoldContainer>
        </>
      )}
    </PipelineRequestStatusProvider>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
