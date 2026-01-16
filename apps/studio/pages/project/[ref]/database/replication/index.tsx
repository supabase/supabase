import { useParams } from 'common'
import { ReplicationComingSoon } from 'components/interfaces/Database/Replication/ComingSoon'
import { Destinations } from 'components/interfaces/Database/Replication/Destinations'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { AlphaNotice } from 'components/ui/AlphaNotice'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const enablePgReplicate = useIsETLPrivateAlpha()
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <>
      {enablePgReplicate ? (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer>
            <ScaffoldSection>
              <div className="col-span-12">
                <div className="w-full mb-6">
                  <div className="flex items-center gap-x-2 mb-1">
                    <h3 className="text-foreground text-xl prose">Replication</h3>
                  </div>
                  <p className="prose text-sm max-w-full">
                    Automatically replicate your database changes to external data warehouses and
                    analytics platforms in real-time
                  </p>
                </div>
                <AlphaNotice
                  entity="Replication"
                  feedbackUrl="https://github.com/orgs/supabase/discussions/39416"
                  className="mb-8"
                />
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
          <ReplicationComingSoon projectRef={ref || '_'} />
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
