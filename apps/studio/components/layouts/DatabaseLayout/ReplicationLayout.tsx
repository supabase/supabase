import { useParams } from 'common'
import { PropsWithChildren } from 'react'

import { DatabaseLayout } from './DatabaseLayout'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export const ReplicationLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  return (
    <DatabaseLayout title="Replication">
      <PipelineRequestStatusProvider key={projectRef}>{children}</PipelineRequestStatusProvider>
    </DatabaseLayout>
  )
}
