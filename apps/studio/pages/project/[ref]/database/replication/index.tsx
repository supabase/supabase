import { Destinations } from '@/components/interfaces/Database/Replication/Destinations'
import { ProjectInfrastructureDiagram } from '@/components/interfaces/Settings/Infrastructure/ProjectInfrastructureDiagram'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { HighAvailabilityDisabledSectionNotice } from '@/components/ui/HighAvailability/HighAvailabilityDisabledSectionNotice'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import {
  HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES,
  useHighAvailability,
} from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
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

      <ProjectInfrastructureDiagram isHighAvailability={isHighAvailability} />

      <ScaffoldContainer>
        <ScaffoldSection isFullWidth className="pt-6!">
          {isHighAvailability && (
            <div className="mb-6">
              <HighAvailabilityDisabledSectionNotice
                feature="Replication"
                title={HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES.noticeTitle}
                description={HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES.noticeDescription}
              />
            </div>
          )}
          <Destinations readOnly={isHighAvailability} />
        </ScaffoldSection>
      </ScaffoldContainer>
    </PipelineRequestStatusProvider>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
