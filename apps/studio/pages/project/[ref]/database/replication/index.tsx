import { ReplicationComingSoon } from 'components/interfaces/Database/Replication/ComingSoon'
import { Destinations } from 'components/interfaces/Database/Replication/Destinations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useFlag } from 'hooks/ui/useFlag'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const enablePgReplicate = useFlag('enablePgReplicate')

  return (
    <>
      {enablePgReplicate ? (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer>
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader title="Replication" />
                <Destinations />
              </div>
            </ScaffoldSection>
          </ScaffoldContainer>
        </PipelineRequestStatusProvider>
      ) : (
        <>
          <ScaffoldContainer>
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader title="Replication" description="Send data to other destinations" />
              </div>
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
