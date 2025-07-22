import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'

export const getStatusName = (
  status: ReplicationPipelineStatusData['status'] | undefined
): string | undefined => {
  if (status && typeof status === 'object' && 'name' in status) {
    return status.name
  }
  return undefined
}