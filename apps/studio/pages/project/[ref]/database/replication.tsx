import ReplicationComingSoon from 'components/interfaces/Database/Replication/ComingSoon'
import Destinations from 'components/interfaces/Database/Replication/Destinations'
import ReplicationPipelineStatus from 'components/interfaces/Database/Replication/ReplicationPipelineStatus'
import { PipelineRequestStatusProvider } from 'components/interfaces/Database/Replication/PipelineRequestStatusContext'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useFlag } from 'hooks/ui/useFlag'
import { useState } from 'react'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const enablePgReplicate = useFlag('enablePgReplicate')
  const [selectedPipelineId, setSelectedPipelineId] = useState<number>()
  const [selectedDestinationName, setSelectedDestinationName] = useState<string>()

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
        <ScaffoldContainer>
          <ScaffoldSection>
            <div className="col-span-12">
              <FormHeader title="Replication" description="Send data to other destinations" />
              <ReplicationComingSoon />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
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
