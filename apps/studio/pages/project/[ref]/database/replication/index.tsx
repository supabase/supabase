import { useState } from 'react'

import { ReplicationComingSoon } from 'components/interfaces/Database/Replication/ComingSoon'
import { Destinations } from 'components/interfaces/Database/Replication/Destinations'
import { ReplicationPipelineStatus } from 'components/interfaces/Database/Replication/ReplicationPipelineStatus'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useFlag } from 'hooks/ui/useFlag'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const enablePgReplicate = useFlag('enablePgReplicate')
  const [selectedPipelineId, setSelectedPipelineId] = useState<number>()
  const [selectedDestinationName, setSelectedDestinationName] = useState<string>()

  // [Joshen] Ideally selecting a pipeline should be a route on its own with pipelineId as the param
  // e.g /project/ref/database/replication/[pipelineId]
  // Can destinationName be derived from pipeline ID or something?

  const handleSelectPipeline = (pipelineId: number, destinationName: string) => {
    setSelectedPipelineId(pipelineId)
    setSelectedDestinationName(destinationName)
  }

  const handleSelectBack = () => {
    setSelectedPipelineId(undefined)
    setSelectedDestinationName(undefined)
  }

  return (
    <>
      {enablePgReplicate ? (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer>
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader title="Replication" />
                {selectedPipelineId === undefined ? (
                  <Destinations onSelectPipeline={handleSelectPipeline} />
                ) : (
                  <ReplicationPipelineStatus
                    pipelineId={selectedPipelineId}
                    destinationName={selectedDestinationName}
                    onSelectBack={handleSelectBack}
                  />
                )}
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
