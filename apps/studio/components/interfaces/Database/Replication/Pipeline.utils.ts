import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'

export const PIPELINE_ERROR_MESSAGES = {
  RETRIEVE_PIPELINE: 'Failed to retrieve pipeline information',
  RETRIEVE_PIPELINE_STATUS: 'Failed to retrieve pipeline status',
  RETRIEVE_REPLICATION_STATUS: 'Failed to retrieve table replication status',
  RETRIEVE_DESTINATIONS: 'Failed to retrieve destinations',
  ENABLE_DESTINATION: 'Failed to enable destination',
  DISABLE_DESTINATION: 'Failed to disable destination',
  DELETE_DESTINATION: 'Failed to delete destination',
  NO_PIPELINE_FOUND: 'No pipeline found',
  COPY_TABLE_STATUS: 'Failed to copy table status',
} as const

export const getStatusName = (
  status: ReplicationPipelineStatusData['status'] | undefined
): ReplicationPipelineStatusData['status']['name'] | undefined => {
  if (status && typeof status === 'object' && 'name' in status) {
    return status.name
  }
  return undefined
}

export const PIPELINE_STATE_MESSAGES = {
  enabling: {
    title: 'Pipeline Enabling',
    message: 'Starting the pipeline. Table replication will resume once enabled.',
    badge: 'Enabling',
  },
  disabling: {
    title: 'Pipeline Disabling',
    message: 'Stopping the pipeline. Table replication will be paused once disabled.',
    badge: 'Disabling',
  },
  failed: {
    title: 'Pipeline Failed',
    message: 'Replication has encountered an error. Check the logs for details.',
    badge: 'Failed',
  },
  stopped: {
    title: 'Pipeline Stopped',
    message: 'Replication is paused. Enable the pipeline to resume data synchronization.',
    badge: 'Stopped',
  },
  starting: {
    title: 'Pipeline Starting',
    message: 'Initializing replication. Table status will be available once running.',
    badge: 'Starting',
  },
  running: {
    title: 'Pipeline Running',
    message: 'Replication is active and processing data',
    badge: 'Running',
  },
  unknown: {
    title: 'Pipeline Status Unknown',
    message: 'Unable to determine replication status. Check the logs for more information.',
    badge: 'Unknown',
  },
  notRunning: {
    title: 'Pipeline Not Running',
    message: 'Replication is not active. Enable the pipeline to start data synchronization.',
    badge: 'Disabled',
  },
} as const

export const getPipelineStateMessages = (
  requestStatus: PipelineStatusRequestStatus | undefined,
  statusName: string | undefined
) => {
  // Always prioritize request status (enabling/disabling) over pipeline status
  if (requestStatus === PipelineStatusRequestStatus.EnableRequested) {
    return PIPELINE_STATE_MESSAGES.enabling
  }

  if (requestStatus === PipelineStatusRequestStatus.DisableRequested) {
    return PIPELINE_STATE_MESSAGES.disabling
  }

  // Only check pipeline status if no request is in progress
  switch (statusName) {
    case 'failed':
      return PIPELINE_STATE_MESSAGES.failed
    case 'stopped':
      return PIPELINE_STATE_MESSAGES.stopped
    case 'starting':
      return PIPELINE_STATE_MESSAGES.starting
    case 'started':
      return PIPELINE_STATE_MESSAGES.running
    case 'unknown':
      return PIPELINE_STATE_MESSAGES.unknown
    default:
      return PIPELINE_STATE_MESSAGES.notRunning
  }
}
