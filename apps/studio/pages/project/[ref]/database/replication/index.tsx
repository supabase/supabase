import { useFlag, useParams } from 'common'
import { ReplicationComingSoon } from 'components/interfaces/Database/Replication/ComingSoon'
import { Destinations } from 'components/interfaces/Database/Replication/Destinations'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

import { ReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const enablePgReplicate = useIsETLPrivateAlpha()
  const showPgReplicate = useIsFeatureEnabled('database:replication')
  const unifiedReplication = useFlag('unifiedReplication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <>
      {unifiedReplication || enablePgReplicate ? (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer>
            <ScaffoldSection isFullWidth>
              <div className="w-full mb-6">
                <div className="flex items-center gap-x-2 mb-1">
                  <h3 className="text-foreground text-xl prose">Replication</h3>
                </div>
                <p className="prose text-sm max-w-full">
                  {unifiedReplication
                    ? 'Deploy read replicas across multiple regions, or replicate database changes to external data warehouses and analytics platforms'
                    : 'Automatically replicate your database changes to external data warehouses and analytics platforms in real-time'}
                </p>
              </div>
            </ScaffoldSection>
          </ScaffoldContainer>

          <ReplicationDiagram />

          <ScaffoldContainer>
            <ScaffoldSection isFullWidth className="!pt-6">
              <Destinations />
            </ScaffoldSection>
          </ScaffoldContainer>
        </PipelineRequestStatusProvider>
      ) : (
        <>
          <ScaffoldContainer>
            <ScaffoldSection isFullWidth>
              <FormHeader
                className="[&>div>p]:max-w-full"
                title="Replication"
                description=" Automatically replicate your database changes to external data warehouses and analytics platforms in real-time"
              />
            </ScaffoldSection>
          </ScaffoldContainer>
          <ReplicationComingSoon />
        </>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
