import { PropsWithChildren } from 'react'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'

export const ReplicationProvider = ({ children }: PropsWithChildren) => {
  return <PipelineRequestStatusProvider>{children}</PipelineRequestStatusProvider>
}

export default ReplicationProvider
