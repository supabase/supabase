import { useFlag, useParams } from 'common'
import { ReplicationComingSoon } from 'components/interfaces/Database/ETL/ComingSoon'
import { Destinations } from 'components/interfaces/Database/ETL/Destinations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const enablePgReplicate = useFlag('enablePgReplicate')
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <PageLayout
      size="large"
      title="ETL Replication"
      subtitle={
        enablePgReplicate
          ? 'Replicate your database to any analytics destination'
          : 'Send data to other destinations'
      }
    >
      {enablePgReplicate ? (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer size="large">
            <ScaffoldSection isFullWidth>
              <Destinations />
            </ScaffoldSection>
          </ScaffoldContainer>
        </PipelineRequestStatusProvider>
      ) : (
        <ReplicationComingSoon projectRef={ref || '_'} />
      )}
    </PageLayout>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database ETL Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
