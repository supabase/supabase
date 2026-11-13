import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FeatureFlagContext } from 'common'
import { useContext, useEffect } from 'react'

import { ReplicationPipelineLayout } from '@/components/interfaces/Database/Replication/ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from '@/components/interfaces/Database/Replication/ReplicationPipelineStatus/ReplicationPipelineStatus'
import { useIsPipelinesEnabled } from '@/components/interfaces/Database/Replication/useIsPipelinesEnabled'

export const Route = createFileRoute('/project/$ref/database/pipelines/$pipelineId')({
  component: DatabasePipelinesPage,
})

function DatabasePipelinesPage() {
  const navigate = useNavigate()
  const { ref: projectRef } = Route.useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const enablePgReplicate = useIsPipelinesEnabled()

  useEffect(() => {
    if (hasLoaded && !enablePgReplicate) {
      void navigate({
        to: '/project/$ref/database/pipelines',
        params: { ref: projectRef },
        replace: true,
      })
    }
  }, [navigate, hasLoaded, projectRef, enablePgReplicate])

  return (
    <>
      {enablePgReplicate && (
        <ReplicationPipelineLayout>
          <ReplicationPipelineStatus />
        </ReplicationPipelineLayout>
      )}
    </>
  )
}
